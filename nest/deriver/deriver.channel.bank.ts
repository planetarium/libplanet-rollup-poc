import { Injectable } from "@nestjs/common";
import { FrameQueue } from "./deriver.frame.queue";
import { ChannelID, DataStatus, Frame } from "./deriver.types";
import { Channel } from "./models/deriver.channel";
import { channelIdToHexKey } from "./deriver.utils";

@Injectable()
export class ChannelBank {
    constructor(
        private readonly frameQueue: FrameQueue,
    ) {}

    channels: Map<string, Channel> = new Map();
    channelQueue: ChannelID[] = [];

    public async nextData(): Promise<Uint8Array | DataStatus> {
        var data = this.read();
        if (data === DataStatus.EOF) {
            var next = await this.frameQueue.nextFrame();
            if (next === DataStatus.EOF) {
                return DataStatus.EOF;
            } else if (next === DataStatus.NotEnoughData) {
                return DataStatus.NotEnoughData;
            } else {
                var frame = next as Frame;
                this.ingestFrame(frame);
                return DataStatus.NotEnoughData;
            }
        }

        return data;
    }

    private read(): Uint8Array | DataStatus {
        if (this.channelQueue.length === 0) {
            return DataStatus.EOF;
        }

        for(var i = 0; i < this.channelQueue.length; i++) {
            var chId = this.channelQueue[i];
            var channel = this.channels.get(channelIdToHexKey(chId));
            if (!channel || !channel.isReady()) {
                continue;
            }

            this.channels.delete(channelIdToHexKey(chId));
            this.channelQueue.splice(i, 1);

            return channel.reader();
        }

        return DataStatus.EOF;
    }

    private ingestFrame(frame: Frame) {
        var channel = this.channels.get(channelIdToHexKey(frame.id));
        if (!channel) {
            channel = new Channel(frame.id);
            this.channels.set(channelIdToHexKey(frame.id), channel);
            this.channelQueue.push(frame.id);
        }

        channel.addFrame(frame);
    }
}