import { Injectable } from "@nestjs/common";
import { ChallengerProposer } from "./challenger.proposer";
import { EvmContractManager } from "src/evm/evm.contracts";
import { ClaimDataInfo, claimDataWrap, DisputeGameDetailInfo, DisputeGameInfo, FaultDisputeGameStatus } from "./challenger.type";
import { FaultDisputeGameBuilder } from "./models/faultdisputegame.builder";
import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmPublicService } from "src/evm/evm.public.service";
import { ChallengerHonest } from "./models/challenger.honest";
import { ConfigService } from "@nestjs/config";
import { ChallengerDishonest } from "./models/challenger.dishonest";
import { LibplanetService } from "src/libplanet/libplanet.service";
import { PreoracleService } from "src/preoracle/preoracle.service";
import { OutputRootProvider } from "./models/challenger.outputroot.provider";
import { Position } from "./utils/challenger.position";
import { ClaimClock } from "./utils/claim.clock";

@Injectable()
export class ChallengerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly challengerProposer: ChallengerProposer,
    private readonly evmClientFactory: EvmClientFactory,
    private readonly evmContractManager: EvmContractManager,
    private readonly evmPublicService: EvmPublicService,
    private readonly libplanetService: LibplanetService,
    private readonly preoracleService: PreoracleService,
  ) {}

  private dishonestAttached: boolean = true;

  public async init() {
    this.challengerProposer.init();

    const faultDisputeGameFactoryReader = this.evmContractManager.getFaultDisputeGameFactoryReader();

    faultDisputeGameFactoryReader.watchEvent.FaultDisputeGameCreated({
      onLogs: async (logs) => {
        if(logs.length === 0) {
          return;
        }
        if(!logs[0].args) {
          return;
        }
        const proxy = logs[0].args.faultDisputeGame;
        if(!proxy) {
          return;
        }
        const faultDisputeGameReader = this.evmContractManager.getFaultDisputeGameReader(proxy);
        const disputeStatus = await faultDisputeGameReader.read.status() as FaultDisputeGameStatus;
        if(disputeStatus === FaultDisputeGameStatus.IN_PROGRESS) {
          await this.attachChallenger(proxy, !this.dishonestAttached);
          this.dishonestAttached = true;
        }
      }
    });

    const gameCount = await faultDisputeGameFactoryReader.read.gameCount();
    for(let i = 0; i < gameCount; i++) {
      const gameAtIndex = await faultDisputeGameFactoryReader.read.gameAtIndex([BigInt(i)]);
      const proxy = gameAtIndex[1];

      const faultDisputeGameReader = this.evmContractManager.getFaultDisputeGameReader(proxy);
      const disputeStatus = await faultDisputeGameReader.read.status() as FaultDisputeGameStatus;
      if(disputeStatus === FaultDisputeGameStatus.IN_PROGRESS) {
        await this.attachChallenger(proxy);
      }
    }
  }

  // for testing purpose
  public async test() {
    const outputRootProvider = new OutputRootProvider(
      this.libplanetService,
      5000n,
      10000n,
      15,
      21,
    );

    var pos = new Position(1n);
    for(var i = 0; i <= 21; i++) {
      const outputRoot = await outputRootProvider.get(pos);
      pos = pos.attack();
    }
  }

  private async attachChallenger(proxy: `0x${string}`, dishonest: boolean = false) {
    const faultDisputeGameBuilderForHonest = new FaultDisputeGameBuilder(
      proxy, 
      this.evmClientFactory,
      this.evmContractManager,
      this.evmPublicService,
    )

    await faultDisputeGameBuilderForHonest.init();

    const faultDisputeGameBuilderForDishonest = new FaultDisputeGameBuilder(
      proxy, 
      this.evmClientFactory,
      this.evmContractManager,
      this.evmPublicService,
    )

    await faultDisputeGameBuilderForDishonest.init();

    const honestChallenger = new ChallengerHonest(
      this.configService,
      faultDisputeGameBuilderForHonest,
      this.libplanetService,
      this.evmPublicService,
      this.preoracleService,
    )

    honestChallenger.init();

    if(dishonest) {
      const dishonestChallenger = new ChallengerDishonest(
        this.configService,
        faultDisputeGameBuilderForDishonest,
        this.evmPublicService,
      )

      dishonestChallenger.init();
    }
  }

  public attachDishonestChallengerNext() {
    this.dishonestAttached = false;
  }

  public async getDisputeInfo() {
    const faultDisputeGameFactoryReader = this.evmContractManager.getFaultDisputeGameFactoryReader();
    const gameCount = await faultDisputeGameFactoryReader.read.gameCount();
    const games: DisputeGameInfo[] = [];
    for(let i = Number(gameCount) - 1; i >= 0; i--) {
      const gameAtIndex = await faultDisputeGameFactoryReader.read.gameAtIndex([BigInt(i)]);
      const proxy = gameAtIndex[1];

      const disputeGameInfo = await this.getDisputeGameInfo(proxy);
      games.push(disputeGameInfo);
    }

    const anchorStateRegistry = this.evmContractManager.getAnchorStateRegistryReader();
    const anchor = await anchorStateRegistry.read.anchor();
    const currentOutputRoot = anchor[0];
    const currentL3BlockNumber = anchor[1];

    return {
      currentOutputRoot: currentOutputRoot,
      currentL3BlockNumber: Number(currentL3BlockNumber),
      games: games,
    }
  }

  public async getDisputeGameDetailInfo(address: `0x${string}`): Promise<DisputeGameDetailInfo> {
    const disputeGameInfo: DisputeGameInfo = await this.getDisputeGameInfo(address);
    const faultDisputeGameReader = this.evmContractManager.getFaultDisputeGameReader(address);
    const claimDatas: ClaimDataInfo[] = [];
    for(let i = 0; i < disputeGameInfo.claimCount; i++) {
      const claimDataRaw = await faultDisputeGameReader.read.claimData([BigInt(i)]);
      const claimData = claimDataWrap(claimDataRaw);
      const claimClock = new ClaimClock(claimData.clock);
      const claimDataInfo: ClaimDataInfo = {
        index: i,
        parentIndex: claimData.parentIndex,
        claimant: claimData.claimant,
        counteredBy: claimData.counteredBy,
        claim: claimData.claim,
        position: claimData.position.getValue().toString(),
        depth: claimData.position.depth(),
        createdAt: new Date(Number(claimClock.timestamp()) * 1000).toISOString(),
      }
      claimDatas.push(claimDataInfo);
    }

    return {
      ...disputeGameInfo,
      claimDatas: claimDatas,
    }
  }

  private async getDisputeGameInfo(address: `0x${string}`): Promise<DisputeGameInfo> {
    const faultDisputeGameReader = this.evmContractManager.getFaultDisputeGameReader(address);
    const disputeStatus = await faultDisputeGameReader.read.status() as FaultDisputeGameStatus;
    const outputRoot = await faultDisputeGameReader.read.rootClaim();
    const l3BlockNumber = await faultDisputeGameReader.read.l2BlockNumber();
    const claimCount = await faultDisputeGameReader.read.claimDataLen();
    const createdAtTimestamp = await faultDisputeGameReader.read.createdAt();
    const createdAt = new Date(Number(createdAtTimestamp) * 1000).toISOString();
    const resolvedAtTimestamp = await faultDisputeGameReader.read.resolvedAt();
    const resolvedAt = resolvedAtTimestamp ? new Date(Number(resolvedAtTimestamp) * 1000).toISOString() : undefined;
    return {
      address: address,
      outputRoot: outputRoot,
      l3BlockNumber: Number(l3BlockNumber),
      status: FaultDisputeGameStatus[disputeStatus],
      claimCount: Number(claimCount),
      createdAt: createdAt,
      resolvedAt: resolvedAt,
    }
  }
}