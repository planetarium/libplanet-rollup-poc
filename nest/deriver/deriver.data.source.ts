import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Address, Block, Transaction } from "viem";

@Injectable()
export class DataSource {
    constructor(
        private readonly configure: ConfigService
    ) {}

    batcherAddress: Address = this.configure.get('batcher_address') as Address;
    batchInboxAddress: Address = this.configure.get('local_contract_address.libplanet_batch_inbox') as Address;

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