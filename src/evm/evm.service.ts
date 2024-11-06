import { Injectable } from "@nestjs/common";
import { EvmContractManager } from "./evm.contracts";
import { KeyUtils } from "src/utils/utils.key";
import { EvmClientFactory } from "./evm.client.factory";
import { EvmPublicService } from "./evm.public.service";
import { ChainManager } from "./evm.chains";
import { ChainContract } from "viem";

@Injectable()
export class EvmService {
    constructor(
      private readonly keyUtils: KeyUtils,
      private readonly clientFactory: EvmClientFactory,
      private readonly contractManager: EvmContractManager,
      private readonly publicService: EvmPublicService,
      private readonly chainManager: ChainManager,
    ) {}

    public async getAnchor() {
      const anchorStateRegistryReader = this.contractManager.getAnchorStateRegistryReader();
      return await anchorStateRegistryReader.read.getAnchor();
    }

    public getAnchorContractDeployedBlockNumber() {
      const anchorContract = this.chainManager.getChain().contracts?.anchorStateRegistry as ChainContract;
      return anchorContract.blockCreated ?? 0;
    }

    public getBatcherWallet() {
      const batcherPrivateKey = this.keyUtils.getBatcherPrivateKey();
      return this.clientFactory.getWalletClient(batcherPrivateKey);
    }

    public getBlockByNumber(blockNumber: bigint) {
      return this.publicService.getBlockByNumber(blockNumber);
    }

    public async findBlockIndexByTimestamp(timestamp: bigint) {
      const block = await this.publicService.findBlockByTimestamp(timestamp);
      return block.number;
    }
}