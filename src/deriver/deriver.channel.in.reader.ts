import { Injectable } from "@nestjs/common";
import { ChannelBank } from "./deriver.channel.bank";
import { BatchReader } from "./models/deriver.batch.reader";
import { Batch, ChannelData, DataStatus } from "./deriver.types";
import { PreoracleDbService } from "src/preoracle/preoracle.db.service";

@Injectable()
export class ChannelInReader {
    constructor(
        private readonly channelBank: ChannelBank,
        private readonly preoracleService: PreoracleDbService,
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
                this.batchReader = new BatchReader(this.preoracleService, next as ChannelData);
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