import { FaultDisputeGameFactory } from "bridge/typechain-types";
import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmPublicService } from "src/evm/evm.public.service";
import { LibplanetGraphQLService } from "src/libplanet/libplanet.graphql.service";
import { KeyUtils } from "src/utils/utils.key";
import { Client, WalletClient } from "viem";

export class ChallengerPropser {
  constructor(
    private readonly clientFactory: EvmClientFactory,
    private readonly contractManager: EvmContractManager,
    private readonly libplanetGraphQlService: LibplanetGraphQLService,
    private readonly evmPublicService: EvmPublicService,
  ){}

  private initialized: boolean = false;

  public async init() {
    if (this.initialized) {
      throw new Error("Already initialized");
    }
    this.initialized = true;
    const walletClient = await this.clientFactory.newWalletClient();
    var res = await this.evmPublicService.waitForTransactionReceipt(walletClient.txHash);
    const faultDisputeGameFactory = this.contractManager.getFaultDisputeGameFactory(walletClient.privateKey);
    const outputProposal = await this.libplanetGraphQlService.getOutputProposal();
    const rootClaim = outputProposal.outputRoot as `0x${string}`;
    const l2BlockNumber = outputProposal.blockIndex;
    const txHash = await faultDisputeGameFactory.write.create([rootClaim, l2BlockNumber]);
    res = await this.evmPublicService.waitForTransactionReceipt(txHash);
  }
}