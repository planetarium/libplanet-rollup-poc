import { Injectable, Logger } from "@nestjs/common";
import { ChannelInReader } from "./deriver.channel.in.reader";
import { Batch, Block, BlocksInfo, DataStatus } from "./deriver.types";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { PublicClientManager } from "nest/evm/public.client";
import { BatchQueue } from "./deriver.batch.queue";
import { check } from "prettier";

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
    deriveInit: boolean = false;
    blocks: Map<bigint, Block> = new Map();
    derivatedLatestBlockIndex: bigint = 0n;
    derivatedOldestBlockIndex: bigint = 0n;

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

        if(!this.deriveInit) {
            this.derivatedLatestBlockIndex = block.index;
            this.derivatedOldestBlockIndex = block.index;
            this.deriveInit = true;
        }

        if(this.derivatedLatestBlockIndex < block.index) {
            this.derivatedLatestBlockIndex = block.index;
        }

        if(this.derivatedOldestBlockIndex > block.index) {
            this.derivatedOldestBlockIndex = block.index;
        }
    }

    public derivateStop() {
        this.deriving = false;
        this.blocks.clear();
        this.deriveInit = false;
    }

    public checkSanity(): boolean {
        if(this.derivatedOldestBlockIndex === this.derivatedLatestBlockIndex
            && this.blocks.size === 0) {
            return true;
        }

        if(this.derivatedLatestBlockIndex - this.derivatedOldestBlockIndex + 1n !== BigInt(this.blocks.size)) {
            return false;
        }

        var sanity: boolean = true;
        for(let i = this.derivatedOldestBlockIndex; i <= this.derivatedLatestBlockIndex; i++) {
            if(!this.blocks.has(i)) {
                sanity = false;
                break;
            }
        }

        return sanity;
    }

    public checkDeriveInit(): boolean {
        return this.deriveInit;
    }

    public getLatestBlockIndex(): bigint {
        return this.derivatedLatestBlockIndex;
    } 

    public getBlocks(): BlocksInfo | DataStatus {
        // Proposer should not call this function while recovering
        if(!this.checkSanity()) {
            throw new Error("blocks are recovering");
        }

        // Proposer should not call this function before any block is loaded
        if(!this.deriveInit) {
            throw new Error("Not loaded any block yet");
        }

        if(this.derivatedOldestBlockIndex === this.derivatedLatestBlockIndex
            && this.blocks.size === 0) {
            return DataStatus.NotEnoughData;
        }

        var blocksClone = Array.from(this.blocks.values());
        var oldestBlockIndex = this.derivatedOldestBlockIndex;
        var latestBlockIndex = this.derivatedLatestBlockIndex;
        this.blocks.clear();
        this.deriveInit = false;
        this.derivatedOldestBlockIndex = this.derivatedLatestBlockIndex;
        return {
            blocks: blocksClone,
            oldestBlockIndex: oldestBlockIndex,
            latestBlockIndex: latestBlockIndex,
        };
    }

    private async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}