import { Injectable } from "@nestjs/common";
import { KeyManager } from "nest/key.utils";
import { ChainManager } from "./evm.chains";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http } from "viem";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class BatcherClientManager {
    constructor(
        private readonly configure: ConfigService,
        private readonly keyManager: KeyManager,
        private readonly chainManager: ChainManager,
    ) {}

    private readonly chain = this.chainManager.getChain();
    private client = this.getClient();

    async batchTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
        return await this.client.sendTransaction({
          to: this.configure.get('libplanet_batch_inbox') as `0x${string}`,
          data: payload,
        });
    }

    private getClient() {
        const account = privateKeyToAccount(
          this.keyManager.getBatcherPrivateKey()
        );
        return createWalletClient({
            chain: this.chain,
            account: account,
            transport: http(),
        });
    }
}