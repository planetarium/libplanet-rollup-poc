import { Injectable } from "@nestjs/common";
import { BlockID, Frame, FrameID, TxData } from "./batcher.types";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { ChannelManager } from "./batcher.channel.manger";
import { WalletManager } from "nest/evm/wallet.client";
import { fromBytes, hexToBytes } from "viem";
import { MaxBlocksPerChannelManager, MaxFrameSize } from "./batcher.constants";
import { PublicClientManager } from "nest/evm/public.client";

@Injectable()
export class BatcherService {
    constructor(
        private readonly ncRpcService: NCRpcService,
        private readonly channelManager: ChannelManager,
        private readonly walletManager: WalletManager,
        private readonly publicClientManager: PublicClientManager,
    ) {}

    lastStoredBlock: BlockID | undefined;
    sentTransactions: `0x${string}`[] = [];
    sentFrames = new Map<FrameID, Uint8Array>();

    public async start(): Promise<void> {
        await this.loadBlocksIntoState(MaxBlocksPerChannelManager);
        await this.publishTxToL1();
    }

    public async loopUntilProcessAllBlocks(stopIndex: bigint): Promise<void> {
        do {
            await this.loadBlocksIntoState(MaxBlocksPerChannelManager);
            await this.publishTxToL1();
        } while (this.lastStoredBlock!.index < stopIndex);
    }

    // for testing purpose
    public async getBatchTransactions() {
        var transactions = [];
        for (let txHash of this.sentTransactions) {
            var transaction = await this.publicClientManager.getTransaction(txHash);
            var input = hexToBytes(transaction.input);
            transactions.push(this.unmarshalFrame(input));
        }
        return transactions;
    }

    // for testing purpose
    private unmarshalFrame(input: Uint8Array): Frame {
        var dataLength = input.length;
        var id = input.slice(0, 16);
        var buffer = Buffer.from(input.slice(16, 18));
        var frameNumber = buffer.readUInt16BE(0);
        var data = input.slice(22, dataLength - 1);
        var isLast = input[dataLength - 1] == 1;

        return {
            id: id,
            frameNumber: frameNumber,
            data: data,
            isLast: isLast
        }
    }

    public async loadBlocksIntoState(blockLimit: number): Promise<void> {
        var blockRange = await this.calculateL2BlockRangeToStore(blockLimit);

        for (let i = blockRange.start.index + 1n; i <= blockRange.end.index; i++) {
            var blockId = await this.loadBlockIntoState(i);
            this.lastStoredBlock = blockId;
        }
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

    private async calculateL2BlockRangeToStore(blockLimit: number): Promise<{
        start: BlockID,
        end: BlockID
    }> {

        if (!this.lastStoredBlock) {
            // todo: get the last stored block from the database
            this.lastStoredBlock = {
                hash: '00',
                index: 0n
            }
        }

        var endBlockId: BlockID
        endBlockId = await this.ncRpcService.getRecentBlockFromLocal();

        var remainedBlockSpace = blockLimit - this.channelManager.blocks.length;

        if(endBlockId.index - this.lastStoredBlock.index >= remainedBlockSpace) {
            var endBlock = await this.ncRpcService.getBlockWithIndexFromLocal(this.lastStoredBlock.index + BigInt(remainedBlockSpace));
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
                var transactionHash = await this.walletManager.batchTransaction(data);
                this.sentTransactions.push(transactionHash);
                this.sentFrames.set(frame.id, frame.data);
            }
            catch (e) {
                console.log(e);
            }
        }
    }
}