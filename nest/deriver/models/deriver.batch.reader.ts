import { Batch, DataStatus } from "../deriver.types";

export class BatchReader{
    data: Uint8Array;
    
    constructor(data: Uint8Array){
        this.data = data;
    }

    public nextBatch(): Batch | DataStatus {
        if (this.data.length < 4) {
            return DataStatus.EOF;
        }

        var batchLengthBytes = Buffer.from(this.data.slice(0, 4));
        this.data = this.data.slice(4);
        var batchLength = batchLengthBytes.readUInt32BE(0);
        if (this.data.length < batchLength) {
            throw new Error("BatchReader: nextBatch: not enough data");
        }

        var batchData = this.data.slice(0, batchLength);
        this.data = this.data.slice(batchLength);

        var batchString = Buffer.from(batchData).toString();
        var batch = JSON.parse(batchString);
        batch.index = BigInt(batch.index);
        batch = batch as Batch;

        return batch;
    }
}