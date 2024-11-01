import { stringify } from "viem";
import { FrameOverHeadSize, MaxEncodingBytesPerChannel, MaxFrameSize } from "../batcher.constants";
import { Batch, ChannelID, Frame } from "../batcher.types";
import { Compressor } from "./batcher.compressor";

export class ChannelOut {
    id: ChannelID;
    frameNumber: number;
    encodingLength: number;
    compress: Compressor;
    closed: boolean;

    constructor() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        this.id = bytes;
        this.frameNumber = 0;
        this.encodingLength = 0;
        this.compress = new Compressor();
        this.closed = false;
    }

    public addBatch(batch: Batch): { isFull: boolean } {
        if (this.closed) {
            return { isFull: true };
        }

        var encoded = this.encodeBatch(batch);

        if (this.encodingLength + encoded.length > MaxEncodingBytesPerChannel) {
            this.closed = true;
            return { isFull: true };
        }

        this.encodingLength += encoded.length;
        this.compress.write(encoded);

        return { isFull: false };
    }

    public readyBytes(): number {
        return this.compress.length();
    }

    public outputFrame(): {
        frameNumber: number;
        data: Uint8Array;
    } {
        var maxDataSize = MaxFrameSize - FrameOverHeadSize;
        var isLast = false;
        if (this.readyBytes() <= maxDataSize) {
            isLast = true;
            maxDataSize = this.readyBytes();
        }
        var data = this.compress.read(maxDataSize);
        var frame = {
            id: this.id,
            frameNumber: this.frameNumber,
            data: data,
            isLast: isLast,
        }

        this.frameNumber += 1;

        return {
            frameNumber: frame.frameNumber,
            data: this.MarshalFrame(frame),
        }
    }

    private encodeBatch(batch: Batch): Uint8Array {
        var data = new Uint8Array(0);
        const hashData = Buffer.from(batch.hash);
        data = new Uint8Array([...data, ...hashData]);
        const indexData = this.bigintToUint8Array(batch.index);
        data = new Uint8Array([...data, ...indexData]);
        if(batch.transactions.length == 0) {
            const endData = Buffer.from([0]);
            data = new Uint8Array([...data, ...endData]);
            return data;
        }
        const txHashData = Buffer.from(batch.txHash);
        data = new Uint8Array([...data, ...txHashData]);
        for (const tx of batch.transactions) {
            const txLengthData = this.numberToUint8Array(tx.length);
            data = new Uint8Array([...data, ...txLengthData]);
            const txData = Buffer.from(tx);
            data = new Uint8Array([...data, ...txData]);
        }

        return data;
    }

    private numberToUint8Array(value: number): Uint8Array {
        const data = new Uint8Array(4);
        for (let i = 0; i < 4; i++) {
            data[i] = (value >> 8 * (3 - i)) & 0xff;
        }
        return data;
    }

    private bigintToUint8Array(value: bigint): Uint8Array {
        const data = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            data[i] = Number((value >> BigInt(8 * (7 - i))) & BigInt(0xff));
        }
        return data;
    }

    private MarshalFrame(frame: Frame): Uint8Array {
        var data = new Uint8Array(0);
        data = new Uint8Array([...data, ...frame.id]);

        const frameNumberBytes = new Uint8Array(2);
        frameNumberBytes[0] = (frame.frameNumber >> 8) & 0xff;
        frameNumberBytes[1] = frame.frameNumber & 0xff;
        data = new Uint8Array([...data, ...frameNumberBytes]);

        const dataLength = frame.data.length;
        const dataLengthBytes = new Uint8Array(4);
        dataLengthBytes[0] = (dataLength >> 24) & 0xff;
        dataLengthBytes[1] = (dataLength >> 16) & 0xff;
        dataLengthBytes[2] = (dataLength >> 8) & 0xff;
        dataLengthBytes[3] = dataLength & 0xff;
        data = new Uint8Array([...data, ...dataLengthBytes]);

        data = new Uint8Array([...data, ...frame.data]);

        const isLastByte = new Uint8Array(1);
        isLastByte[0] = frame.isLast ? 1 : 0;
        data = new Uint8Array([...data, ...isLastByte]);

        return data;
    }
}