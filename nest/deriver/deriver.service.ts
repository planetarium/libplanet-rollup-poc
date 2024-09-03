import { Injectable, Logger } from "@nestjs/common";
import { ChannelInReader } from "./deriver.channel.in.reader";
import { Batch, Block, DataStatus } from "./deriver.types";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { PublicClientManager } from "nest/evm/public.client";
import { BatchQueue } from "./deriver.batch.queue";

@Injectable()
export class DeriverService {
    constructor(
        private readonly publicClientManager: PublicClientManager,
        private readonly l1Retrieval: L1Retrieval,
        private readonly batchQueue: BatchQueue,
    ) {
        this.derivateStart();
    }

    private readonly logger = new Logger(DeriverService.name);

    private readonly TIME_INTERVAL = 10000;

    derivatedLatestBlockIndex: bigint = 0n;
    deriving: boolean = false;
    deriveInit: boolean = true;
    blocks: Block[] = [];

    async derivateStart() {
        var l1OutputBlockIndex = await this.publicClientManager.getLatestOutputRootBlockIndex();
        if (l1OutputBlockIndex === undefined) {
            throw new Error("Failed to get latest output root block index");
        }

        if(this.deriving){
            throw new Error("Already deriving");
        }

        this.deriving = true;

        this.l1Retrieval.setL1BlockNumber(l1OutputBlockIndex);

        this.logger.log(`Derivation started from block ${l1OutputBlockIndex}`);

        while (this.deriving) {
            var next = await this.batchQueue.nextBlock();
            if (next === DataStatus.EOF) {
                this.logger.log(`Derivation paused: derived ${this.blocks.length} blocks`);
                await this.delay(this.TIME_INTERVAL);
                this.logger.log(`Derivation resumed`);
                continue;
            } else if (next === DataStatus.NotEnoughData) {
                this.l1Retrieval.advanceBlock();
                continue;
            } else {
                var res = next as Block;
                if(this.deriveInit) {
                    this.derivatedLatestBlockIndex = res.index;
                    this.deriveInit = false;
                } else {
                    if(this.derivatedLatestBlockIndex + 1n !== res.index) {
                        throw new Error("Block index is not continuous");
                    }
                    this.derivatedLatestBlockIndex = res.index;
                    this.blocks.push(res);
                }
            }
        }
    }

    async derivateStop() {
        this.deriving = false;
    }

    async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}