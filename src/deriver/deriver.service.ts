import { Injectable, Logger } from "@nestjs/common";
import { Batch, Block, BlocksInfo, DataStatus } from "./deriver.types";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { BatchQueue } from "./deriver.batch.queue";
import { ConfigService } from "@nestjs/config";
import { LibplanetService } from "src/libplanet/libplanet.service";
import { EvmService } from "src/evm/evm.service";

@Injectable()
export class DeriverService {
    constructor(
        private readonly l1Retrieval: L1Retrieval,
        private readonly batchQueue: BatchQueue,
        private readonly configService: ConfigService,
        private readonly evmService: EvmService,
        private readonly libplanetService: LibplanetService,
    ) {}

    private readonly logger = new Logger(DeriverService.name);
    private readonly useDebug = this.configService.get('deriver.debug', false);
    private log(log: any) {
        if(this.useDebug) {
            this.logger.debug(log);
        } else {
            this.logger.log(log);
        }
    }

    private readonly TIME_INTERVAL = this.configService.get('deriver.time_interval', 10000);

    deriving: boolean = false;
    deriveInit: boolean = false;
    blocks: Map<bigint, Block> = new Map();
    derivatedLatestBlockIndex: bigint = 0n;
    derivatedOldestBlockIndex: bigint = 0n;

    public async deriveStart() {
        if(this.deriving){
            throw new Error("Already deriving");
        }

        var l1OutputBlockIndex = this.l1Retrieval.getL1BlockNumber();
        if(l1OutputBlockIndex === 0n) {
            const anchor = await this.evmService.getAnchor();
            const latestAnchorTimestamp = await this.libplanetService.getBlockTimestampByIndex(anchor.l2BlockNumber);
            const l1latestAnchorBlockNumber = await this.evmService.findBlockIndexByTimestamp(latestAnchorTimestamp);
            const anchorContractDeployedBlockNumber = BigInt(this.evmService.getAnchorContractDeployedBlockNumber());
            const l1StartingBlockNumber = l1latestAnchorBlockNumber > anchorContractDeployedBlockNumber 
                ? l1latestAnchorBlockNumber : anchorContractDeployedBlockNumber;
            if (l1StartingBlockNumber === undefined) {
                throw new Error("Failed to get latest output root block index");
            }

            l1OutputBlockIndex = l1StartingBlockNumber;
            this.l1Retrieval.setL1BlockNumber(l1OutputBlockIndex);
        }

        this.deriving = true;

        var latestL1BlockIndex = this.l1Retrieval.getL1BlockNumber();
        this.log(`Derivation started from L2 ${latestL1BlockIndex} block`);

        while (this.deriving) {
            var next = await this.batchQueue.nextBlock();
            latestL1BlockIndex = this.l1Retrieval.getL1BlockNumber();

            if (next === DataStatus.EOF) {
                this.log(`Derivation paused: derived up to L2 ${latestL1BlockIndex} block`);
                if(this.blocks.size > 0) {
                    this.log(`Derivated block count: ${this.blocks.size}`);
                }
                await this.delay(this.TIME_INTERVAL);
                continue;
            } else if (next === DataStatus.NotEnoughData) {
                if(latestL1BlockIndex % 100n === 0n) {
                    this.log(`Derivating: derived up to L2 ${latestL1BlockIndex} block`);
                }
                await this.l1Retrieval.advanceBlock();
                continue;
            } else if (next === DataStatus.ProcessingData) {
                continue;
            } else {
                var res = next as Block;
                await this.handleBlock(res);
            }
        }

        this.log(`Derivation stopped`);
    }

    public getDerivingStatus(): boolean {
        return this.deriving;
    }

    public deriveStop() {
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