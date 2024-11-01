import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KeyUtils } from "src/utils/utils.key";
import { Address, Block, Transaction } from "viem";

@Injectable()
export class DataSource {
    constructor(
        private readonly keyUtils: KeyUtils,
    ) {}

    batcherAddress: Address = this.keyUtils.getBatcherAddress();
    batchInboxAddress: Address = this.keyUtils.getBatchInboxAddress();

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