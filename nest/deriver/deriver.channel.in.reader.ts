import { Injectable } from "@nestjs/common";
import { ChannelBank } from "./deriver.channel.bank";
import { BatchReader } from "./models/deriver.batch.reader";
import { Batch, DataStatus } from "./deriver.types";

@Injectable()
export class ChannelInReader {
    constructor(
        private readonly channelBank: ChannelBank,
    ) {}

    batchReader?: BatchReader

    async nextBatch(): Promise<Batch | DataStatus> {
        if (!this.batchReader){
            var next = await this.channelBank.nextData();
            if (next === DataStatus.EOF) {
                return DataStatus.EOF;
            } else if (next === DataStatus.NotEnoughData) {
                return DataStatus.NotEnoughData;
            } else if (next === DataStatus.ProcessingData) {
                return DataStatus.ProcessingData;
            } else {
                this.batchReader = new BatchReader(next as Uint8Array);
            }
        }

        var batch = await this.batchReader.nextBatch();
        if (batch === DataStatus.EOF) {
            this.batchReader = undefined;
            return DataStatus.ProcessingData;
        }

        return batch;
    }
}