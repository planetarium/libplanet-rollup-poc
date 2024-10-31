import { Injectable, Logger } from "@nestjs/common";
import { BlockID, BlockRange, DataStatus, Frame, FrameID, TxData } from "./batcher.types";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { ChannelManager } from "./batcher.channel.manger";
import { fromBytes, hexToBytes } from "viem";
import { MaxBlocksPerChannelManager, MaxFrameSize } from "./batcher.constants";
import { PublicClientManager } from "nest/evm/public.client";
import { ConfigService } from "@nestjs/config";
import { BatcherClientManager } from "nest/evm/batcher.client";

@Injectable()
export class BatcherService {
    constructor(
        private readonly ncRpcService: NCRpcService,
        private readonly channelManager: ChannelManager,
        private readonly batcherClientManager: BatcherClientManager,
        private readonly publicClientManager: PublicClientManager,
        private readonly configService: ConfigService,
    ) {}

    private readonly logger = new Logger(BatcherService.name);

    private webLog?: (log: any) => void;
    public setWebLog(logger: (log: any) => void) {
        this.webLog = logger;
    }
    private log(log: any) {
        this.logger.log(log);
        if (this.webLog) {
            this.webLog(log);
        }
    }

    private readonly TIME_INTERVAL = this.configService.get('batcher.time_interval', 10000);

    lastStoredBlock: BlockID | undefined;
    batching: boolean = false;

    public async batchStart(): Promise<void> {
        if (this.batching) {
            throw new Error("Already batching");
        }

        this.batching = true;

        this.log("Batching started");

        while(this.batching) {
            var res = await this.loadBlocksIntoState(MaxBlocksPerChannelManager);
            if (res === DataStatus.NotEnoughData) {
                this.log("Batching paused: not enough data");
                await this.delay(this.TIME_INTERVAL);
                continue;
            } else {
                var blockRange = res as BlockRange;
                this.log(`Loaded L3 blocks from ${blockRange.start.index} to ${blockRange.end.index}`);
                await this.publishTxToL1();
            }
        }

        this.log("Batching stopped");
    }

    public getBatchingStatus(): boolean {
        return this.batching;
    }

    public batchStop() {
        this.batching = false;
    }

    public async loopUntilProcessAllBlocks(stopIndex: bigint): Promise<void> {
        do {
            await this.loadBlocksIntoState(MaxBlocksPerChannelManager);
            await this.publishTxToL1();
        } while (this.lastStoredBlock!.index < stopIndex);
    }

    public async loadBlocksIntoState(blockLimit: number): Promise<DataStatus | BlockRange> {
        var res = await this.calculateL2BlockRangeToStore(blockLimit);
        if (res === DataStatus.NotEnoughData) {
            return DataStatus.NotEnoughData;
        }

        var blockRange = res as BlockRange;

        if (blockRange.start.index === blockRange.end.index) {
            if (this.channelManager.blocks.length === 0) {
                return DataStatus.NotEnoughData;
            } else {
                return blockRange;
            }
        }

        for (let i = blockRange.start.index + 1n; i <= blockRange.end.index; i++) {
            var blockId = await this.loadBlockIntoState(i);
            this.lastStoredBlock = blockId;
        }

        return blockRange;
    }

    private async loadBlockIntoState(index: bigint): Promise<BlockID> {
        var block = await this.ncRpcService.getBlockWithIndex(index);

        if (!block) {
            throw new Error('block not found');
        }

        this.channelManager.addBlock(block);

        return {
            hash: block.hash,
            index: block.index
        }
    }

    private async calculateL2BlockRangeToStore(blockLimit: number): Promise<BlockRange | DataStatus> {

        if (!this.lastStoredBlock) {
            await this.initBlock();
            if(!this.lastStoredBlock) {
                return DataStatus.NotEnoughData;
            }
        }

        var endBlockId: BlockID
        endBlockId = await this.ncRpcService.getRecentBlock();

        var remainedBlockSpace = blockLimit - this.channelManager.blocks.length;

        if(endBlockId.index - this.lastStoredBlock.index >= remainedBlockSpace) {
            var endBlock = await this.ncRpcService.getBlockWithIndex(this.lastStoredBlock.index + BigInt(remainedBlockSpace));
            var endBlockId = {
                hash: endBlock.hash,
                index: endBlock.index
            }
        }

        return {
            start: this.lastStoredBlock,
            end: endBlockId
        };
    }

    private async initBlock() {
        var outputRoot = await this.publicClientManager.getLatestOutputRoots();
        if (!outputRoot) {
            throw new Error("Failed to get latest output root");
        }

        var block = await this.ncRpcService.getBlockWithIndex(outputRoot.l2BlockNumber!);
        if (!block) {
            throw new Error("Failed to get block");
        }

        this.lastStoredBlock = {
            hash: block.hash,
            index: block.index
        }
    }

    public async publishTxToL1(): Promise<void> {
        var txData = this.channelManager.TxData();

        if (txData.frames.length == 0) {
            return;
        }

        await this.sendTransactionToL1(txData);
    }

    private async sendTransactionToL1(txData: TxData): Promise<void> {
        for (let frame of txData.frames) {
            var data = fromBytes(frame.data, 'hex');
            try {
                await this.batcherClientManager.batchTransaction(data);
                this.log(`Sent batch transaction to L2`);
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    async delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
}