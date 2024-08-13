import { Injectable } from "@nestjs/common";
import { BlockID } from "./batcher.types";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { start } from "repl";
import { ChannelManager } from "./batcher.channel.manger";

@Injectable()
export class BatcherService {
    constructor(
        private readonly ncRpcService: NCRpcService,
        private readonly channelManager: ChannelManager
    ) {}

    lastStoredBlock: BlockID | undefined;

    public async start(): Promise<void> {
        await this.loadBlocksIntoState();
        await this.publishTxToL1();
    }

    private async loadBlocksIntoState(): Promise<void> {
        var blockRange = await this.calculateL2BlockRangeToStore();

        for (let i = blockRange.start.index + 1n; i <= blockRange.end.index; i++) {
            var blockId = await this.loadBlockIntoState(i);
            this.lastStoredBlock = blockId;
        }

        var blocks = this.channelManager.getBlocks();
    }

    private async loadBlockIntoState(index: bigint): Promise<BlockID> {
        var block = await this.ncRpcService.getBlockWithIndexFromLocal(index);

        if (!block) {
            throw new Error('block not found');
        }

        this.channelManager.addBlock(block);

        return {
            hash: block.hash,
            index: block.index
        }
    }

    private async calculateL2BlockRangeToStore(): Promise<{
        start: BlockID,
        end: BlockID
    }> {

        if (!this.lastStoredBlock) {
            // todo: get the last stored block from the database
            this.lastStoredBlock = {
                hash: '00',
                index: 19500n
            }
        }

        var recentBlock: BlockID
        recentBlock = await this.ncRpcService.getRecentBlockFromLocal();

        return {
            start: this.lastStoredBlock,
            end: recentBlock
        };
    }

    private async publishTxToL1(): Promise<void> {
    }
}