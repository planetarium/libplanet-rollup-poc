import { Injectable } from "@nestjs/common";
import { EvmContractManager } from "./evm.contracts";
import { KeyUtils } from "src/utils/utils.key";
import { EvmClientFactory } from "./evm.client.factory";
import { EvmPublicService } from "./evm.public.service";

@Injectable()
export class EvmService {
    constructor(
      private readonly keyUtils: KeyUtils,
      private readonly clientFactory: EvmClientFactory,
      private readonly contractManager: EvmContractManager,
      private readonly publicService: EvmPublicService,
    ) {}

    public async getAnchor() {
      const anchorStateRegistryReader = this.contractManager.getAnchorStateRegistryReader();
      return await anchorStateRegistryReader.read.getAnchor();
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