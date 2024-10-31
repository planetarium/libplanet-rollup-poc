import { Injectable } from "@nestjs/common";
import { EvmContractManager } from "src/evm/evm.contracts";
import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";
import { KeyUtils } from "src/utils/utils.key";
import { ChallengerPropser } from "./models/challenger.proposer";
import { ChallengerDishonest } from "./models/challenger.dishonest";
import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmPublicService } from "src/evm/evm.public.service";
import { ChallengerHonest } from "./models/challenger.honest";

@Injectable()
export class ChallengerService {
  constructor(
    private readonly keyUtils: KeyUtils,
    private readonly evmContractManager: EvmContractManager,
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
    private readonly evmClientFactory: EvmClientFactory,
    private readonly evmPublicService: EvmPublicService,
  ) {
    //this.init();
  }

  private init() {
    const challengerProposer = new ChallengerPropser(this.evmClientFactory, this.evmContractManager, this.libplanetGraphQlService, this.evmPublicService);
    challengerProposer.init();

    const challengerDishonest = new ChallengerDishonest(this.evmClientFactory, this.evmContractManager, this.libplanetGraphQlService, this.evmPublicService);
    challengerDishonest.init();

    const challengerHonest = new ChallengerHonest(this.evmClientFactory, this.evmContractManager, this.libplanetGraphQlService, this.evmPublicService);
    challengerHonest.init();
  }
}