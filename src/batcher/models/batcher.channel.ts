import { FrameOverHeadSize, MaxFrameSize } from "../batcher.constants";
import { Batch, Block, FrameData } from "../batcher.types";
import { ChannelOut } from "./batcher.channel.out";

export class Channel {
    co: ChannelOut;
    frames: FrameData[];

    constructor() {
        this.co = new ChannelOut();
        this.frames = [];
    }

    public isFull(): boolean {
        return this.co.closed;
    }

    public AddBlock(block: Block): { isFull: boolean } {
        if (this.isFull()) {
            return { isFull: true };
        }

        var batch = this.blockToBatch(block);
        var result = this.co.addBatch(batch);

        if (result.isFull) {
            return { isFull: true };
        }

        return { isFull: false };
    }

    private blockToBatch(block: Block): Batch {
        return {
            hash: block.hash,
            index: block.index,
            txHash: block.txHash,
            transactions: block.transactions.map(tx => 
                Buffer.from(tx.serializedPayload, 'base64'))
        }
    }

    public outputFrames(): void {
        while(this.co.readyBytes()+FrameOverHeadSize >= MaxFrameSize) {
            this.outputFrame();
        }

        if(this.co.closed) {
            this.outputFrame();
        }
    }

    private outputFrame(): void {
        var result = this.co.outputFrame();

        this.frames.push({
            id: {
                channelID: this.co.id,
                frameNumber: result.frameNumber
            },
            data: result.data
        });
    }

    public nextFrame(): FrameData | undefined {
        return this.frames.shift();
    }

    public hasTxData(): boolean {
        return this.frames.length > 0;
    }
}