import { Injectable } from "@nestjs/common";
import { ChannelInReader } from "./deriver.channel.in.reader";
import { Batch, Block, DataStatus, Transaction } from "./deriver.types";

@Injectable()
export class BatchQueue {
    constructor(
        private readonly channelInReader: ChannelInReader,
    ) {}

    batches: Batch[] = [];

    async nextBlock(): Promise<Block | DataStatus> {
        if (this.batches.length === 0) {
            var next = await this.channelInReader.nextBatch();
            if (next === DataStatus.EOF) {
                return DataStatus.EOF;
            } else if (next === DataStatus.NotEnoughData) {
                return DataStatus.NotEnoughData;
            } else if (next === DataStatus.ProcessingData) {
                return DataStatus.ProcessingData;
            } else {
                this.batches.push(next as Batch);
            }
        }

        var batch = this.batches.shift();
        if (batch === undefined) {
            throw new Error("Batch is undefined");
        }

        return this.batchToBlock(batch);
    }

    private batchToBlock(batch: Batch): Block {
        return {
            hash: batch.hash,
            index: batch.index,
            miner: batch.miner,
            transactions: batch.transactions.map(tx => {
                return {
                    serializedPayload: Buffer.from(tx).toString('base64'),
                }
            }),
        }
    }
}