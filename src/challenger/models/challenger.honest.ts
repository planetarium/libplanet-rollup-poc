import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";
import { ClaimData, claimDataWrap, claimId, FaultDisputeGameStatus } from "../challenger.type";
import { EvmPublicService } from "src/evm/evm.public.service";
import { parseAbiItem, parseEventLogs } from "viem";
import { Logger } from "@nestjs/common";
import { OutputRootProvider } from "./challenger.outputroot.provider";
import { HonestClaimTracker } from "./honest.claim.tracker";
import { Position } from "../challenger.position";
import { ConfigService } from "@nestjs/config";
import { FaultDisputeGameBuilder } from "./faultdisputegame.builder";
import { ClaimResolver } from "./claim.resolver";

export class ChallengerHonest {
  constructor(
    private readonly configService: ConfigService,
    private readonly faultDisputeGameBuilder: FaultDisputeGameBuilder,
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
    private readonly evmPublicService: EvmPublicService,
  ){
    const disputeGameProxy = this.faultDisputeGameBuilder.build().address;
    this.CHALLENGER_ID = disputeGameProxy.slice(2, 5);
    this.logger = new Logger(`ChallengerHonest-${this.CHALLENGER_ID}`);

    this.claimResolver = new ClaimResolver(this.faultDisputeGameBuilder);
  }

  private readonly CHALLENGER_ID: string;
  private readonly logger: Logger;

  private readonly logEnabled = this.configService.get('challenger.debug', false);
  private log(log: any) {
    if(this.logEnabled) {
      this.logger.log(log);
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

    const faultDisputeGame = this.faultDisputeGameBuilder.build();
    const prestateBlockIndex = await faultDisputeGame.read.startingBlockNumber();
    const poststateBlockIndex = await faultDisputeGame.read.l2BlockNumber();
    this.splitDepth = Number(await faultDisputeGame.read.splitDepth());
    this.maxDepth = Number(await faultDisputeGame.read.maxGameDepth());
    this.maxClockDuration = await faultDisputeGame.read.maxClockDuration();
    const outputRootProvider = new OutputRootProvider(this.libplanetGraphQlService, prestateBlockIndex, poststateBlockIndex, this.splitDepth);

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
          await faultDisputeGame.write.resolve();
          continue;
        } else {
          this.log(`Not all claims resolved yet`);
        }

        if(claimDataLen === 1n && rootClaimAgreed) {
          this.log(`Root claim is agreed and no other claims exist`);
          continue;
        }

        await this.action(
          claims,
          outputRootProvider
        );
      } else {
        this.initialized = false;
        this.log(`Game is already resolved`);
        return;
      }
    }
  }

  private async action(claims: ClaimData[], outputRootProvider: OutputRootProvider) {
    const faultDisputeGame = this.faultDisputeGameBuilder.build();

    var claims: ClaimData[] = [];
    var claimIds = new Map<`0x${string}`, boolean>();
    const claimDataLen = await faultDisputeGame.read.claimDataLen();
    for(let i = 0n; i < claimDataLen; i++) {
      claims.push(claimDataWrap(await faultDisputeGame.read.claimData([i])));
      claimIds.set(claimId(claims[Number(i)]), true);
    }
    
    for(let i = 1; i < claims.length; i++){
      const claim = claims[i];
      const depth = claim.position.depth();
      if(depth === this.maxDepth){
        await this.step();
      } else {
        if(depth < this.splitDepth){
          await this.move(outputRootProvider, i, claim, this.agreedClaims, claimIds);
        }
      }
    }
  }

  private async step() {
    this.log('Honest: Step');
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

    this.log(`Honest: need to count ${claimData.position.getValue()}`);

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

      txHash = await faultDisputeGame.write.attack([parentClaim, BigInt(claimDataIndex), claim as `0x${string}`]);
      this.log(`Honest: Attack: ${parentClaimPosition.getValue()} ${claimPosition.getValue()}`);
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

      txHash = await faultDisputeGame.write.defend([parentClaim, BigInt(claimDataIndex), claim as `0x${string}`]);
      this.log(`Honest: Defend: ${parentClaimPosition.getValue()} ${claimPosition.getValue()}`);
    }

    const res = await this.evmPublicService.waitForTransactionReceipt(txHash);
    if(res.logs.length > 0){
      const eventAbi = parseAbiItem('event Move(uint256 indexed parentIndex, bytes32 indexed claim, address indexed claimant)');
      const event = parseEventLogs({
        abi: [eventAbi],
        logs: res.logs
      })[0].args;
      this.log(`Move: ${event.parentIndex} ${event.claim} ${event.claimant}`);
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

  private async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}