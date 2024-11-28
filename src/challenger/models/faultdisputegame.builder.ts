import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmPublicService } from "src/evm/evm.public.service";

export class FaultDisputeGameBuilder {
  constructor(
    private readonly disputeGameProxy: `0x${string}`,
    private readonly clientFactory: EvmClientFactory,
    private readonly contractManager: EvmContractManager,
    private readonly evmPublicService: EvmPublicService,
  ) {}

  private initialized: boolean = false;

  private privateKey: `0x${string}` = '0x0';

  private publicAddress: `0x${string}` = '0x0';

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }

    this.initialized = true;
    const walletClient = await this.clientFactory.newWalletClient();
    await this.evmPublicService.waitForTransactionReceipt(walletClient.txHash);
    this.privateKey = walletClient.privateKey;
    this.publicAddress = walletClient.client.account.address;
  }

  public build() {
    if (!this.initialized) {
      throw new Error("Not initialized");
    }

    return this.contractManager.getFaultDisputeGame(this.disputeGameProxy, this.privateKey);
  }

  public getPublicAddress() {
    return this.publicAddress;
  }
}