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

    deriving: boolean = false;
    deriveInit: boolean = true;
    blocks: Map<bigint, Block> = new Map();
    derivatedLatestBlockIndex: bigint = 0n;
    derivatedOldestBlockIndex: bigint = 0n;

    recovering: boolean = false;
    recoveringLatestBlockIndex: bigint = 0n;
    recoveringOldestBlockIndex: bigint = 0n;

    public async derivateStart() {
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
                this.logger.log(`Derivation paused: derived ${this.derivatedLatestBlockIndex - this.derivatedOldestBlockIndex} blocks`);
                await this.delay(this.TIME_INTERVAL);
                this.logger.log(`Derivation resumed`);
                continue;
            } else if (next === DataStatus.NotEnoughData) {
                this.l1Retrieval.advanceBlock();
                continue;
            } else {
                var res = next as Block;
                this.handleBlock(res);
            }
        }
    }

    private handleBlock(block: Block) {
        this.blocks.set(block.index, block);

        if(this.recovering) {
            if (block.index < this.recoveringOldestBlockIndex) {
                this.recoveringLatestBlockIndex = block.index;
                this.recoveringOldestBlockIndex = block.index;
            } else if (block.index > this.recoveringLatestBlockIndex + 1n) {
                throw new Error("Block index is not continuous");
            } else {
                this.recoveringLatestBlockIndex = block.index;
                if (this.recoveringLatestBlockIndex === this.derivatedOldestBlockIndex) {
                    this.derivatedOldestBlockIndex = this.recoveringOldestBlockIndex;
                    this.recoveringLatestBlockIndex = 0n;
                    this.recoveringOldestBlockIndex = 0n;
                    this.recovering = false;
                }
            }
        }

        if(this.deriveInit) {
            this.derivatedLatestBlockIndex = block.index;
            this.derivatedOldestBlockIndex = block.index;
            this.deriveInit = false;
        } else {
            if (block.index < this.derivatedOldestBlockIndex) {
                if (!this.recovering) {
                    this.recovering = true;
                    this.recoveringLatestBlockIndex = block.index;
                    this.recoveringOldestBlockIndex = block.index;
                }
            } else if (block.index > this.derivatedLatestBlockIndex + 1n) {
                throw new Error("Block index is not continuous");
            } else {
                if (block.index > this.derivatedLatestBlockIndex) {
                    this.derivatedLatestBlockIndex = block.index;
                }
            }
        }
    }

    public derivateStop() {
        this.deriving = false;
    }

    public checkRecovering() {
        return this.recovering;
    }

    public nextBlock(): Block | DataStatus {
        // Proposer should not call this function while recovering
        if(this.recovering) {
            throw new Error("Recovering");
        }

        if(this.deriveInit) {
            return DataStatus.NotEnoughData;
        }

        if(this.derivatedOldestBlockIndex === this.derivatedLatestBlockIndex
            && !this.blocks.has(this.derivatedOldestBlockIndex)) {
            return DataStatus.NotEnoughData;
        }

        var block = this.blocks.get(this.derivatedOldestBlockIndex);
        if(block === undefined) {
            throw new Error("Block is undefined");
        } else {
            this.blocks.delete(this.derivatedOldestBlockIndex);
            this.derivatedOldestBlockIndex++;
            return block;
        }
    }

    private async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}