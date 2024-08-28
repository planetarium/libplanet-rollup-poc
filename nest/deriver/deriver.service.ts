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

                this.logger.debug(`Load L1 blocks until ${this.l1Retrieval.l1BlockNumber} block`);
                this.logger.debug(`Derivated ${this.derivatedBlockCount} L2 blocks, ${this.derivatedTransactionsCount} transactions`);
                this.logger.debug(`Latest L2 block index: ${this.derivatedLatestBlockIndex}`);
                this.logger.debug("Derivation finished");

                break;
            } else if (next === DataStatus.NotEnoughData) {
                if(BigInt(this.l1Retrieval.l1BlockNumber) % 500n === 0n) {
                    this.logger.debug(`Load L1 blocks until ${this.l1Retrieval.l1BlockNumber} block`);
                }
                this.l1Retrieval.advanceBlock();
                continue;
            } else {
                res = next as Batch;
                this.derivatedBlockCount++;
                this.derivatedTransactionsCount += BigInt(res.transactions.length);
                if(this.derivatedLatestBlockIndex < res.index) {
                    this.derivatedLatestBlockIndex = res.index;
                }
                if(this.derivatedBlockCount % 2000n === 0n) {
                    this.logger.debug(`Derivated ${this.derivatedBlockCount} L2 blocks, ${this.derivatedTransactionsCount} transactions`);
                    this.logger.debug(`Latest L2 block index: ${this.derivatedLatestBlockIndex}`);
                }
            }
        }

        return res;
    }
}