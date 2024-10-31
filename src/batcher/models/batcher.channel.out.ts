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

        // todo: maybe need to use a better encoding
        var encoded = Buffer.from((stringify(batch)));

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

    private MarshalFrame(frame: Frame): Uint8Array {
        var data = new Uint8Array(0);
        data = new Uint8Array([...data, ...frame.id]);

        const frameNumberBytes = new Uint8Array(2);
        frameNumberBytes[0] = (frame.frameNumber >> 8) & 0xff;
        frameNumberBytes[1] = frame.frameNumber & 0xff;
        data = new Uint8Array([...data, ...frameNumberBytes]);

        const  dataLength = frame.data.length;
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