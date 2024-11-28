import { Injectable } from "@nestjs/common";
import { ChallengerProposer } from "./challenger.proposer";
import { EvmContractManager } from "src/evm/evm.contracts";
import { FaultDisputeGameStatus } from "./challenger.type";
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

  public async init() {
    this.challengerProposer.init();

    const faultDisputeGameFactoryReader = this.evmContractManager.getFaultDisputeGameFactoryReader();

    var dishonestAttached = false;

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
          await this.attachChallenger(proxy, !dishonestAttached);
          dishonestAttached = true;
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
}