import { Injectable, Logger } from "@nestjs/common";
import { ChannelInReader } from "./deriver.channel.in.reader";
import { Batch, DataStatus } from "./deriver.types";
import { L1Retrieval } from "./dertiver.l1.retrieval";

@Injectable()
export class DeriverService {
    constructor(
        private readonly l1Retrieval: L1Retrieval,
        private readonly channelInReader: ChannelInReader,
    ) {}

    private readonly logger = new Logger(DeriverService.name);

    derivatedLatestBlockIndex: bigint = 0n;
    derivatedBlockCount: bigint = 0n;
    derivatedTransactionsCount: bigint = 0n;

    async derivate(start: bigint) {
        this.l1Retrieval.setL1BlockNumber(start);
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
                res = next as Batch;
                this.derivatedBlockCount++;
                this.derivatedTransactionsCount += BigInt(res.transactions.length);
                if(this.derivatedLatestBlockIndex < res.index) {
                    this.derivatedLatestBlockIndex = res.index;
                }
            }
        }

        return res;
    }
}