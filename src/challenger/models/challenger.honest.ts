import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";
import { ClaimData, claimDataWrap, claimId, FaultDisputeGameStatus } from "../challenger.type";
import { EvmPublicService } from "src/evm/evm.public.service";
import { ExecutionRevertedError, parseAbiItem, parseEventLogs, TransactionReceipt } from "viem";
import { Logger } from "@nestjs/common";
import { OutputRootProvider } from "./challenger.outputroot.provider";
import { HonestClaimTracker } from "./honest.claim.tracker";
import { Position } from "../utils/challenger.position";
import { ConfigService } from "@nestjs/config";
import { FaultDisputeGameBuilder } from "./faultdisputegame.builder";
import { ClaimResolver } from "./claim.resolver";
import { LibplanetService } from "src/libplanet/libplanet.service";
import { PreoracleService } from "src/preoracle/preoracle.service";

export class ChallengerHonest {
  constructor(
    private readonly configService: ConfigService,
    private readonly faultDisputeGameBuilder: FaultDisputeGameBuilder,
    private readonly libplanetService: LibplanetService,
    private readonly evmPublicService: EvmPublicService,
    private readonly preoracleService: PreoracleService,
  ){
    const disputeGameProxy = this.faultDisputeGameBuilder.build().address;
    this.CHALLENGER_ID = disputeGameProxy.slice(2, 5);
    this.logger = new Logger(`ChallengerHonest-${this.CHALLENGER_ID}`);

    this.claimResolver = new ClaimResolver(this.faultDisputeGameBuilder, this.evmPublicService);
  }

  private readonly CHALLENGER_ID: string;
  private readonly logger: Logger;

  private readonly logEnabled = this.configService.get('challenger.debug', false);
  private log(log: any) {
    if(this.logEnabled) {
      this.logger.debug(log);
    }
  }

  private readonly TIME_INTERVAL = this.configService.get('challenger.time_interval', 3000);

  private readonly claimResolver: ClaimResolver;

  private agreedClaims: HonestClaimTracker = new HonestClaimTracker();

  private initialized: boolean = false;

  private splitDepth: number = 0;
  private maxDepth: number = 0;
  private maxClockDuration: bigint = 0n;

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }

    this.initialized = true;
    this.log(`Initialized`);

    this.setEventReader();

    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    const prestateBlockIndex = await faultDisputeGame.read.startingBlockNumber();
    const poststateBlockIndex = await faultDisputeGame.read.l2BlockNumber();
    this.splitDepth = Number(await faultDisputeGame.read.splitDepth());
    this.maxDepth = Number(await faultDisputeGame.read.maxGameDepth());
    this.maxClockDuration = await faultDisputeGame.read.maxClockDuration();
    const outputRootProvider = new OutputRootProvider(
      this.libplanetService, prestateBlockIndex, poststateBlockIndex, this.splitDepth, this.maxDepth);

    const rootClaimData = claimDataWrap(await faultDisputeGame.read.claimData([0n]));
    const rootClaimAgreed = await this.agreeWithRootClaim(rootClaimData, outputRootProvider);

    if(rootClaimAgreed){
      this.log(`Root claim is agreed`);
      const claimData = claimDataWrap(await faultDisputeGame.read.claimData([0n]));
      this.agreedClaims.addHonestClaim(undefined, claimData);
    }

    while(this.initialized) {
      await this.delay(this.TIME_INTERVAL);

      const status = await faultDisputeGame.read.status() as FaultDisputeGameStatus;
      if(status === FaultDisputeGameStatus.IN_PROGRESS){
        const currentTimestamp = await this.evmPublicService.getLatestBlockTimestamp();

        const claimDataLen = await faultDisputeGame.read.claimDataLen();
        var claims: ClaimData[] = [];
        var claimIds = new Map<`0x${string}`, boolean>();
        for(let i = 0n; i < claimDataLen; i++) {
          claims.push(claimDataWrap(await faultDisputeGame.read.claimData([i])));
          claimIds.set(claimId(claims[Number(i)]), true);
        }

        const resolvedAllClaims = await this.claimResolver.tryResolveAllClaims(claims, currentTimestamp, this.maxClockDuration);
        if(resolvedAllClaims) {
          this.log(`All claims resolved`);
          const txHash = await faultDisputeGame.write.resolve();
          const res: TransactionReceipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
          const eventAbi = parseAbiItem('event Resolved(uint256 indexed l2BlockNumber, bytes32 indexed rootClaim, uint8 status)');
          const event = parseEventLogs({
              abi: [eventAbi],
              logs: res.logs
          })[0].args;
          if(event.status !== FaultDisputeGameStatus.IN_PROGRESS) {
            this.initialized = false;
            this.logger.debug(`Game is resolved with status ${event.status}`);
            continue;
          }
        } else {
          this.logger.log(`Not all claims resolved yet`);
        }

        if(claimDataLen === 1n && rootClaimAgreed) {
          this.logger.log(`Root claim is agreed and no other claims exist`);
          continue;
        }

        await this.action(
          claims,
          claimIds,
          outputRootProvider
        );
      } else {
        this.initialized = false;
        this.log(`Game is already resolved`);
        return;
      }
    }
  }

  private async action(claims: ClaimData[], claimIds: Map<`0x${string}`, boolean>, outputRootProvider: OutputRootProvider) {
    for(let i = 1; i < claims.length; i++){
      const claim = claims[i];
      const depth = claim.position.depth();
      if(depth === this.maxDepth){
        await this.step(outputRootProvider, i, claim, this.agreedClaims);
      } else {
        await this.move(outputRootProvider, i, claim, this.agreedClaims, claimIds);
      }
    }
  }

  private async step(
    outputRootProvider: OutputRootProvider,
    claimDataIndex: number,
    claimData: ClaimData,
    agreedClaims: HonestClaimTracker
  ) {
    const faultDisputeGame = this.faultDisputeGameBuilder.build();

    const counteredBy = Buffer.from(claimData.counteredBy.slice(2), 'hex');
    const isCountered = counteredBy.readBigInt64BE() !== 0n;
    if(isCountered){
      return;
    }

    const shouldCounter = await this.shouldCounter(claimData, agreedClaims);
    if(!shouldCounter){
      return;
    }

    const parentClaimPosition = claimData.position;
    const parentClaim = claimData.claim;
    const parentHonestClaim = await outputRootProvider.get(parentClaimPosition);
    const agreedToParentClaim = parentClaim === parentHonestClaim;

    const disputedBlockNumber = (await outputRootProvider.getDisputedNumber(parentClaimPosition)).blockNumber;
    this.logger.debug(`Step | Start | disputedBlockNumber: ${disputedBlockNumber}`);
    const batchIndexData = await this.preoracleService.prepareDisputeStep(disputedBlockNumber);
    this.logger.debug('Step | prepare done');
    const batchIndexDataHex = `0x${batchIndexData.toString('hex')}` as `0x${string}`;

    try {
      this.logger.debug('Step | call step');
      if(agreedToParentClaim) {
        const txHash = await faultDisputeGame.write.step([BigInt(claimDataIndex), false, batchIndexDataHex]);
        const txReceipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
        this.logger.debug(`Step | txReceipt: ${txReceipt.status}`);
      } else {
        const txHash = await faultDisputeGame.write.step([BigInt(claimDataIndex), true, batchIndexDataHex]);
        const txReceipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
        this.logger.debug(`Step | txReceipt: ${txReceipt.status}`);
      }

      this.logger.debug(`Step | done`);
    } catch(e) {
      this.logger.error(e);
    }
  }

  private async move(
    outputRootProvider: OutputRootProvider,
    claimDataIndex: number,
    claimData: ClaimData,
    agreedClaims: HonestClaimTracker,
    claimIds: Map<`0x${string}`, boolean>
  ) {
    const faultDisputeGame = this.faultDisputeGameBuilder.build();

    const shouldCounter = await this.shouldCounter(claimData, agreedClaims);
    if(!shouldCounter){
      return;
    }

    const parentClaimPosition = claimData.position;
    const parentClaim = claimData.claim;
    const parentHonestClaim = await outputRootProvider.get(parentClaimPosition);
    const agreedToParentClaim = parentClaim === parentHonestClaim;

    let txHash: `0x${string}`;
    let newClaimData: ClaimData | undefined = undefined;
    if(!agreedToParentClaim){
      const claimPosition = parentClaimPosition.attack();
      const claim = await outputRootProvider.get(claimPosition);

      newClaimData = {
        parentIndex: claimDataIndex,
        counteredBy: '0x0',
        claimant: '0x0',
        bond: 0n,
        claim: claim,
        position: claimPosition,
        clock: 0n,
      } as ClaimData;

      this.agreedClaims.addHonestClaim(claimData, newClaimData);
      const newClaimId = claimId(newClaimData);
      if(claimIds.has(newClaimId)){
        return;
      }

      const disputedNumber = await outputRootProvider.getDisputedNumber(claimPosition);
      this.log(`Disputed number: ${disputedNumber.blockNumber} ${disputedNumber.transactionNumber}`);
      txHash = await faultDisputeGame.write.attack([parentClaim, BigInt(claimDataIndex), claim as `0x${string}`]);
      this.log(`Attack | parentClaimIndex: ${claimDataIndex} claimDepth: ${claimPosition.depth()} claim: ${claim}`);
    } else {
      const claimPosition = parentClaimPosition.defend();
      const claim = await outputRootProvider.get(claimPosition);

      newClaimData = {
        parentIndex: claimDataIndex,
        counteredBy: '0x0',
        claimant: '0x0',
        bond: 0n,
        claim: claim,
        position: claimPosition,
        clock: 0n,
      } as ClaimData;

      this.agreedClaims.addHonestClaim(claimData, newClaimData);
      const newClaimId = claimId(newClaimData);
      if(claimIds.has(newClaimId)){
        return;
      }

      const disputedNumber = await outputRootProvider.getDisputedNumber(claimPosition);
      this.log(`Disputed number: ${disputedNumber.blockNumber} ${disputedNumber.transactionNumber}`);
      txHash = await faultDisputeGame.write.defend([parentClaim, BigInt(claimDataIndex), claim as `0x${string}`]);
      this.log(`Defend | parentClaimIndex: ${claimDataIndex} claimDepth: ${claimPosition.depth()} claim: ${claim}`);
    }

    if(txHash){
      await this.evmPublicService.waitForTransactionReceipt(txHash);
    }

    return newClaimData;
  }

  private async shouldCounter(
    claim: ClaimData,
    agreedClaims: HonestClaimTracker
  ) {
    const faultDisputeGame = this.faultDisputeGameBuilder.build();

    if(agreedClaims.isHonest(claim)){
      return false;
    }

    if(claim.position.isRoot()){
      return true;
    }

    const parentIndex = BigInt(claim.parentIndex);
    const parentClaimData = await faultDisputeGame.read.claimData([parentIndex]);
    const parent = claimDataWrap(parentClaimData);
    if(agreedClaims.isHonest(parent)){
      return true;
    }

    const counter = agreedClaims.honestCounter(parent);
    if(counter === undefined){
      return false;
    }

    const maxDepth = Number(await faultDisputeGame.read.maxGameDepth());
    const honestIdx = counter.position.traceIndex(maxDepth);
    const claimIdx = claim.position.traceIndex(maxDepth);
    return claimIdx <= honestIdx;
  }

  private async agreeWithRootClaim(rootClaimData: ClaimData, outputRootProvider: OutputRootProvider) {
    const rootClaim = rootClaimData.claim;
    const outputRoot = await outputRootProvider.get(new Position(1n));

    return rootClaim === outputRoot;
  }

  private setEventReader() {
    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    faultDisputeGame.watchEvent.Move({}, {
      onLogs: async (logs) => {
        if(logs.length === 0) {
          return;
        }
        if(!logs[0].args) {
          return;
        }
        const parentIndex = logs[0].args.parentIndex;
        const claim = logs[0].args.claim;
        const claimant = logs[0].args.claimant;
        this.logger.log(`Move: ${parentIndex} ${claim} ${claimant}`);
      }
    });
  }

  private async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}