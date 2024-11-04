import { Injectable } from "@nestjs/common";
import { PreoracleService } from "src/preoracle/preoracle.service";
import { KeyUtils } from "src/utils/utils.key";
import { Address, Block, Transaction } from "viem";

@Injectable()
export class DataSource {
    constructor(
        private readonly keyUtils: KeyUtils,
        private readonly preoracleService: PreoracleService,
    ) {}

    batcherAddress: Address = this.keyUtils.getBatcherAddress();
    batchInboxAddress: Address = this.keyUtils.getBatchInboxAddress();

    public async openData(block: Block): Promise<Uint8Array[]> {
        var datas: Uint8Array[] = [];

        for(var tx of block.transactions) {
            var txData = tx as Transaction;
            if(txData.from.toLowerCase() === this.batcherAddress.toLowerCase()
                && txData.to?.toLowerCase() === this.batchInboxAddress.toLowerCase()) {
                const data = Uint8Array.from(Buffer.from(txData.input.slice(2), 'hex'));
                datas.push(data);
                await this.preoracleService.postBatchTransaction({
                    transactionHash: txData.hash,
                    data: data,
                })
            }
        }
        return datas;
    }
}