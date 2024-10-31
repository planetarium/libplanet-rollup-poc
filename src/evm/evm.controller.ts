import { Controller, Get, Logger, Param, Query } from "@nestjs/common";
import { EvmContractManager } from "./evm.contracts";
import { KeyUtils } from "src/utils/utils.key";
import { Address, stringify } from "viem";
import { EvmClientFactory } from "./evm.client.factory";
import { EvmPublicService } from "./evm.public.service";

@Controller("evm")
export class EvmController {
  constructor(
    private readonly contractManager: EvmContractManager,
    private readonly keyUtils: KeyUtils,
    private readonly clientFactory: EvmClientFactory,
    private readonly evmPublicService: EvmPublicService,
  ) {}

  private readonly logger = new Logger(EvmController.name);

  @Get("get/imple")
  async getImple() {
    const faultDisputeGameFactory = this.contractManager.getFaultDisputeGameFactoryReader();
    const imple = await faultDisputeGameFactory.read.faultDisputeGameImplementation();

    return imple;
  }

  @Get("create/game")
  async createGame() {
    const privateKey = this.keyUtils.getMainPrivateKey();
    const faultDisputeGameFactory = this.contractManager.getFaultDisputeGameFactory(privateKey);
    const rootClaim = "0x0000000000000000000000000000000000000000000000000000000000000003";
    const l2BlockNumber = 2n;
    await faultDisputeGameFactory.write.create([rootClaim, l2BlockNumber]);

    return "Game created";
  }

  @Get("get/game/:address")
  async getGame(@Param("address") address: Address) {
    const faultDisputeGame = this.contractManager.getFaultDisputeGameReader(address);
    const maxGameDepth = await faultDisputeGame.read.maxGameDepth();
    const splitDepth = await faultDisputeGame.read.splitDepth();
    const maxClockDuration = await faultDisputeGame.read.maxClockDuration();
    const anchorStateRegistry = await faultDisputeGame.read.anchorStateRegistry();

    return {
      maxGameDepth: (maxGameDepth).toString(),
      splitDepth: (splitDepth).toString(),
      maxClockDuration: (maxClockDuration).toString(),
      anchorStateRegistry: anchorStateRegistry,
    }
  }

  @Get("new/wallet")
  async newWallet() {
    const walletClient = await this.clientFactory.newWalletClient();
    return walletClient.client.account.address;
  }

  @Get("get/balance/:address")
  async getBalance(@Param("address") address: Address) {
    const balance = await this.evmPublicService.getBalance(address);

    return balance;
  }
}