import { Injectable, Logger } from "@nestjs/common";
import { Batch, Block, BlocksInfo, DataStatus } from "./deriver.types";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { PublicClientManager } from "nest/evm/public.client";
import { BatchQueue } from "./deriver.batch.queue";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DeriverService {
    constructor(
        private readonly publicClientManager: PublicClientManager,
        private readonly l1Retrieval: L1Retrieval,
        private readonly batchQueue: BatchQueue,
        private readonly configService: ConfigService,
    ) {}

    private readonly logger = new Logger(DeriverService.name);

    private readonly TIME_INTERVAL = this.configService.get('deriver.time_interval', 10000);

    deriving: boolean = false;
    deriveInit: boolean = false;
    blocks: Map<bigint, Block> = new Map();
    derivatedLatestBlockIndex: bigint = 0n;
    derivatedOldestBlockIndex: bigint = 0n;

    public async derivateStart() {

        if(this.deriving){
            throw new Error("Already deriving");
        }

        var l1OutputBlockIndex = this.l1Retrieval.getL1BlockNumber();
        if(l1OutputBlockIndex === 0n) {
            var latestOutputRootBlockIndex = await this.publicClientManager.getLatestOutputRootBlockIndex();
            if (latestOutputRootBlockIndex === undefined) {
                throw new Error("Failed to get latest output root block index");
            }

            l1OutputBlockIndex = latestOutputRootBlockIndex;
            this.l1Retrieval.setL1BlockNumber(l1OutputBlockIndex);
        }

        this.deriving = true;

        var check = this.l1Retrieval.getL1BlockNumber();
        this.logger.log(`Derivation started from block ${check}`);

        while (this.deriving) {
            var next = await this.batchQueue.nextBlock();
            if (next === DataStatus.EOF) {
                var latestL1BlockIndex = this.l1Retrieval.getL1BlockNumber() - 1n;
                this.logger.log(`Derivation paused: derived up to ${latestL1BlockIndex} block`);
                this.logger.log(`Derivated block count: ${this.blocks.size}`);
                await this.delay(this.TIME_INTERVAL);
                continue;
            } else if (next === DataStatus.NotEnoughData) {
                var latestL1BlockIndex = this.l1Retrieval.getL1BlockNumber() - 1n;
                await this.l1Retrieval.advanceBlock();
                continue;
            } else if (next === DataStatus.ProcessingData) {
                continue;
            } else {
                var res = next as Block;
                await this.handleBlock(res);
            }
        }

        this.logger.log(`Derivation stopped`);
    }

    public getDerivingStatus(): boolean {
        return this.deriving;
    }

    public derivateStop() {
        this.deriving = false;
    }

    private async handleBlock(block: Block) {
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

    public getOldestBlockIndex(): bigint {
        return this.derivatedOldestBlockIndex;
    }

    public getLatestBlockIndex(): bigint {
        return this.derivatedLatestBlockIndex;
    } 

    public deleteUntilBlockIndex(blockIndex: bigint): void {
        if(this.derivatedOldestBlockIndex === this.derivatedLatestBlockIndex
            && this.blocks.size === 0) {
            return;
        }

        if(this.derivatedOldestBlockIndex > blockIndex) {
            return;
        }

        for(let i = this.derivatedOldestBlockIndex; i <= blockIndex; i++) {
            if(this.blocks.has(i)) {
                this.blocks.delete(i);
            }
        }

        if(this.blocks.size === 0) {
            this.deriveInit = false;
            this.derivatedLatestBlockIndex = blockIndex;
            this.derivatedOldestBlockIndex = blockIndex;
            return;
        } else {
            for(let i = blockIndex + 1n; i <= this.derivatedLatestBlockIndex; i++) {
                if(this.blocks.has(i)) {
                    this.derivatedOldestBlockIndex = i;
                    break;
                }
            }
        }
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