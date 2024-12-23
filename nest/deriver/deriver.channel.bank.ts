import { Injectable } from "@nestjs/common";
import { FrameQueue } from "./deriver.frame.queue";
import { ChannelID, DataStatus, Frame } from "./deriver.types";
import { Channel } from "./models/deriver.channel";

@Injectable()
export class ChannelBank {
    constructor(
        private readonly frameQueue: FrameQueue,
    ) {}

    channels: Map<string, Channel> = new Map();
    channelQueue: ChannelID[] = [];

    public async nextData(): Promise<Uint8Array | DataStatus> {
        var data = await this.read();
        if (data === DataStatus.EOF) {
            var next = await this.frameQueue.nextFrame();
            if (next === DataStatus.EOF) {
                return DataStatus.EOF;
            } else if (next === DataStatus.NotEnoughData) {
                return DataStatus.NotEnoughData;
            } else {
                var frame = next as Frame;
                await this.ingestFrame(frame);
                return DataStatus.ProcessingData;
            }
        }

        return data;
    }

    private async read(): Promise<Uint8Array | DataStatus> {
        if (this.channelQueue.length === 0) {
            return DataStatus.EOF;
        }

        for(var i = 0; i < this.channelQueue.length; i++) {
            var chId = this.channelQueue[i];
            var channel = this.channels.get(this.channelIdToHexKey(chId));
            if (!channel || !channel.isReady()) {
                continue;
            }

            this.channels.delete(this.channelIdToHexKey(chId));
            this.channelQueue.splice(i, 1);

            return channel.reader();
        }

        return DataStatus.EOF;
    }

    private async ingestFrame(frame: Frame) {
        var channel = this.channels.get(this.channelIdToHexKey(frame.id));
        if (!channel) {
            channel = new Channel(frame.id);
            this.channels.set(this.channelIdToHexKey(frame.id), channel);
            this.channelQueue.push(frame.id);
        }

        channel.addFrame(frame);
    }

    private channelIdToHexKey(id: ChannelID): string {
        return Buffer.from(id).toString("hex");
    }
}