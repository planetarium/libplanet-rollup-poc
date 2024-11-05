import { Injectable } from "@nestjs/common";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { Batch, BatchTransaction, DataStatus, Frame } from "./deriver.types";

@Injectable()
export class FrameQueue {
    constructor(
        private readonly l1Retrieval: L1Retrieval,
    ) {}

    frames: Frame[] = [];

    public async nextFrame(): Promise<Frame | DataStatus> {
        if (this.frames.length === 0) {
            var next = await this.l1Retrieval.nextData();
            if (next === DataStatus.EOF) {
                return DataStatus.EOF;
            } else if (next === DataStatus.NotEnoughData) {
                return DataStatus.NotEnoughData;
            } else {
                var data = next as BatchTransaction;
                this.frames.push(this.unmarshalFrame(data));

                // todo: maybe there would be a better way to handle this
                if (this.l1Retrieval.getDatasLength() == 0) {
                    return DataStatus.NotEnoughData;
                }
            }
        }

        if (this.frames.length > 0) {
            return this.frames.shift() as Frame;
        } else {
            throw new Error("FrameQueue: nextFrame: no frames available");
        }
    }

    private unmarshalFrame(batchTransaction: BatchTransaction): Frame {
        var input = batchTransaction.data;
        var dataLength = input.length;
        var id = input.slice(0, 16);
        var buffer = Buffer.from(input.slice(16, 18));
        var frameNumber = buffer.readUInt16BE(0);
        var data = input.slice(22, dataLength - 1);
        var isLast = input[dataLength - 1] == 1;

        return {
            id: id,
            frameNumber: frameNumber,
            data: data,
            isLast: isLast,

            transactionHash: batchTransaction.transactionHash,
            dataLength: dataLength,
        }
    }
}