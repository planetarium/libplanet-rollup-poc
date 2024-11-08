import { Injectable } from "@nestjs/common";
import { ChallengerPropser } from "./challenger.proposer";
import { EvmContractManager } from "src/evm/evm.contracts";
import { FaultDisputeGameStatus } from "./challenger.type";
import { FaultDisputeGameBuilder } from "./models/faultdisputegame.builder";
import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmPublicService } from "src/evm/evm.public.service";
import { ChallengerHonest } from "./models/challenger.honest";
import { ConfigService } from "@nestjs/config";
import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";

@Injectable()
export class ChallengerService {
  constructor(
    private readonly configService: ConfigService,
    private readonly challengerProposer: ChallengerPropser,
    private readonly evmClientFactory: EvmClientFactory,
    private readonly evmContractManager: EvmContractManager,
    private readonly evmPublicService: EvmPublicService,
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
  ) {}

  public async init() {
    this.challengerProposer.init();

    const faultDisputeGameFactoryReader = this.evmContractManager.getFaultDisputeGameFactoryReader();
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

    await faultDisputeGameFactoryReader.watchEvent.FaultDisputeGameCreated({
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
          await this.attachChallenger(proxy);
        }
      }
    });
  }

  private async attachChallenger(proxy: `0x${string}`) {
    const faultDisputeGameBuilder = new FaultDisputeGameBuilder(
      proxy, 
      this.evmClientFactory,
      this.evmContractManager,
      this.evmPublicService,
    )

    await faultDisputeGameBuilder.init();

    const honestChallenger = new ChallengerHonest(
      this.configService,
      faultDisputeGameBuilder,
      this.libplanetGraphQlService,
      this.evmPublicService,
    )

    try {
      honestChallenger.init();
    } catch (e) {
      console.error(e);
    }
  }
}