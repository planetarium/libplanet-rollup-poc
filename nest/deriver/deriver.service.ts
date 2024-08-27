import { Injectable } from "@nestjs/common";
import { ChannelInReader } from "./deriver.channel.in.reader";
import { DataStatus } from "./deriver.types";
import { L1Retrieval } from "./dertiver.l1.retrieval";

@Injectable()
export class DeriverService {
    constructor(
        private readonly l1Retrieval: L1Retrieval,
        private readonly channelInReader: ChannelInReader,
    ) {}

    async test() {
        var res;
        while (true) {
            var next = await this.channelInReader.nextBatch();
            if (next === DataStatus.EOF) {
                res = "EOF";
                break;
            } else if (next === DataStatus.NotEnoughData) {
                this.l1Retrieval.advanceBlock();
                continue;
            } else {
                res = next;
            }
        }

        return res;
    }
}