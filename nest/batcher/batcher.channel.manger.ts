import { Injectable } from "@nestjs/common";
import { Block, TxData } from "./batcher.types";
import { Channel } from "./models/batcher.channel";

@Injectable()
export class ChannelManager {
    constructor() {}

    blocks: Block[] = [];
    channelQueue: Channel[] = [];
    currentChannel: Channel | undefined;

    public getBlocks(): Block[] {
        return this.blocks;
    }

    public addBlock(block: Block): void {
        this.blocks.push(block);
    }

    public TxData(): TxData {
        this.ensureChannelWithSpace();
        this.processBlocks();
        this.outputFrames();

        return {
            frames: []
        }
    }

    private ensureChannelWithSpace(): void {
        if (!this.currentChannel || this.currentChannel.isFull()) {
            this.currentChannel = new Channel();
            this.channelQueue.push(this.currentChannel);
        }
    }

    private processBlocks(): void {
        for (let block of this.blocks) {
            var result = this.currentChannel?.AddBlock(block);
            if (result?.isFull) {
                break;
            }
        }
    }

    private outputFrames(): void {
        this.currentChannel?.outputFrames();
    }

    // todo: need to change if we use blob
    private nextTxData(channel: Channel): TxData {
        var frame = channel.nextFrame();
        if (!frame) {
            return {
                frames: []
            }
        }

        return {
            frames: [frame]
        }
    }
}