import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KeyManager } from "nest/key.utils";
import { Address, Block, Transaction } from "viem";

@Injectable()
export class DataSource {
    constructor(
        private readonly configure: ConfigService,
        private readonly keyManager: KeyManager,
    ) {}

    batcherAddress: Address = this.keyManager.getBatcherAddress();
    chain: string = this.configure.get('wallet.chain') as string;
    batchInboxAddress: Address = 
        this.chain === 'mothership_testnet' ? this.configure.get('contracts.mothership_testnet.libplanet_batch_inbox') as Address
        : this.chain === 'localhost' ? this.configure.get('contracts.localhost.libplanet_batch_inbox') as Address
        : '0x'

    public async openData(block: Block): Promise<Uint8Array[]> {
        var datas: Uint8Array[] = [];
        block.transactions.forEach(tx => {
            var txData = tx as Transaction;
            if(txData.from.toLowerCase() === this.batcherAddress.toLowerCase() 
                && txData.to?.toLowerCase() === this.batchInboxAddress.toLowerCase()) {
                datas.push(Uint8Array.from(Buffer.from(txData.input.slice(2), 'hex')));
            }
        });
        return datas;
    }
}