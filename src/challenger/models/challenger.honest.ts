import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmContractManager } from "src/evm/evm.contracts";
import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";
import { ClaimData, claimDataWrap, claimId, FaultDisputeGameStatus } from "../challenger.type";
import { EvmPublicService } from "src/evm/evm.public.service";
import { getAddress, parseAbiItem, parseEventLogs } from "viem";
import { Logger } from "@nestjs/common";
import { OutputRootProvider } from "./challenger.outputroot.provider";
import { HonestClaimTracker } from "./honest.claim.tracker";
import { Position } from "../challenger.position";
import { max } from "rxjs";

export class ChallengerHonest {
  constructor(
    private readonly clientFactory: EvmClientFactory,
    private readonly contractManager: EvmContractManager,
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
    private readonly evmPublicService: EvmPublicService,
  ){}

  private walletClient;

  private initialized: boolean = false;

  private readonly logger = new Logger(ChallengerHonest.name);

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }

    this.walletClient = await this.clientFactory.newWalletClient();
    var res = this.evmPublicService.waitForTransactionReceipt(this.walletClient.txHash);
    const privateKey = this.walletClient.privateKey;

    const faultDisputeGameFactory = this.contractManager.getFaultDisputeGameFactory(privateKey);

    this.initialized = true;

    while(this.initialized) {
      await this.delay(3000);

      const gameCount = await faultDisputeGameFactory.read.gameCount();
      if(gameCount === 0n){
        continue;
      }
      const gameIndex = gameCount - 1n;
      const gameAtIndex = await faultDisputeGameFactory.read.gameAtIndex([gameIndex]);
      const proxy = gameAtIndex[1];
      const faultDisputeGame = this.contractManager.getFaultDisputeGame(proxy, privateKey);

      const status = await faultDisputeGame.read.status() as FaultDisputeGameStatus;
      if(status === FaultDisputeGameStatus.IN_PROGRESS){
        await this.action(faultDisputeGame);
      } else {
        this.initialized = false;
        this.logger.log(`Game ${gameIndex} is finished`);
      }
    }
  }

  private async action(faultDisputeGame: any) {
    const prestateBlockIndex = await faultDisputeGame.read.startingBlockNumber();
    const poststateBlockIndex = await faultDisputeGame.read.l2BlockNumber();
    const splitDepth = await faultDisputeGame.read.splitDepth();
    const maxDepth = await faultDisputeGame.read.maxGameDepth();
    const outputRootProvider = new OutputRootProvider(this.libplanetGraphQlService, prestateBlockIndex, poststateBlockIndex, Number(maxDepth));

    const rootClaimAgreed = await this.agreeWithRootClaim(faultDisputeGame, outputRootProvider);

    var claims: ClaimData[] = [];
    var claimIds = new Map<`0x${string}`, boolean>();
    const claimDataLen = await faultDisputeGame.read.claimDataLen();
    for(let i = 0; i < claimDataLen; i++){
      claims.push(claimDataWrap(await faultDisputeGame.read.claimData([i])));
      claimIds.set(claimId(claims[i]), true);
    }

    const agreedClaims = new HonestClaimTracker();
    if(rootClaimAgreed){
      agreedClaims.addHonestClaim(undefined, claims[0]);
    }
    for(let i = 1; i < claims.length; i++){
      const claim = claims[i];
      const depth = claim.position.depth();
      if(depth == maxDepth){
        this.step();
        continue;
      } else {
        const newClaimData = await this.move(faultDisputeGame, outputRootProvider, i, claim, agreedClaims, claimIds);
        if(newClaimData !== undefined){
          agreedClaims.addHonestClaim(claim, newClaimData);
        }
      }
    }
  }

  private step() {
    this.logger.log('Honest: Step');
  }

  private async move(
    faultDisputeGame: any,
    outputRootProvider: OutputRootProvider,
    claimDataIndex: number,
    claimData: ClaimData,
    agreedClaims: HonestClaimTracker,
    claimIds: Map<`0x${string}`, boolean>
  ) {
    const shouldCounter = await this.shouldCounter(faultDisputeGame, claimData, agreedClaims);
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

      agreedClaims.addHonestClaim(claimData, newClaimData);
      const newClaimId = claimId(newClaimData);
      if(claimIds.has(newClaimId)){
        return;
      }

      txHash = await faultDisputeGame.write.attack([parentClaim, claimDataIndex, claim]);
      this.logger.log(`Honest: Attack: ${parentClaimPosition.getValue()} ${claimPosition.getValue()}`);
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

      agreedClaims.addHonestClaim(claimData, newClaimData);
      const newClaimId = claimId(newClaimData);
      if(claimIds.has(newClaimId)){
        return;
      }

      txHash = await faultDisputeGame.write.defend([parentClaim, claimDataIndex, claim]);
      this.logger.log(`Honest: Defend: ${parentClaimPosition.getValue()} ${claimPosition.getValue()}`);
    }

    const res = await this.evmPublicService.waitForTransactionReceipt(txHash);
    if(res.logs.length > 0){
      const eventAbi = parseAbiItem('event Move(uint256 indexed parentIndex, bytes32 indexed claim, address indexed claimant)');
      const event = parseEventLogs({
        abi: [eventAbi],
        logs: res.logs
      })[0].args;
      //this.logger.log(`Move: ${event.parentIndex} ${event.claim} ${event.claimant}`);
    }

    return newClaimData;
  }

  private async shouldCounter(
    faultDisputeGame: any,
    claim: ClaimData,
    agreedClaims: HonestClaimTracker
  ) {
    if(agreedClaims.isHonest(claim)){
      return false;
    }

    if(claim.position.isRoot()){
      return true;
    }

    const parentClaimData = await faultDisputeGame.read.claimData([claim.parentIndex]);
    const parent = claimDataWrap(parentClaimData);
    if(agreedClaims.isHonest(parent)){
      return true;
    }

    const counter = agreedClaims.honestCounter(parent);
    if(counter === undefined){
      return false;
    }

    const maxDepth = await faultDisputeGame.read.maxGameDepth();
    const honestIdx = counter.position.traceIndex(maxDepth);
    const claimIdx = claim.position.traceIndex(maxDepth);
    return claimIdx <= honestIdx;
  }

  private async agreeWithRootClaim(faultDisputeGame: any, outputRootProvider: OutputRootProvider): Promise<boolean> {
    const rootClaim = await faultDisputeGame.read.rootClaim();
    const outputRoot = await outputRootProvider.get(new Position(1n));

    return rootClaim === outputRoot;
  }

  private async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}