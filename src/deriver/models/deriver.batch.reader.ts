import { PreoracleService } from "src/preoracle/preoracle.service";
import { Batch, ChannelData, DataStatus, FrameInfo } from "../deriver.types";

export class BatchReader{
    private readonly preoracleService: PreoracleService;

    data: Uint8Array;
    frameInfos: FrameInfo[] = [];

    currentIndex: number = 0;
    currentFrameNumber: number = 0;
    
    constructor(
        preoracleService: PreoracleService,
        channelData: ChannelData,
    ){
        this.preoracleService = preoracleService;
        this.data = channelData.data;
        this.frameInfos = channelData.frameInfos;
    }

    public async nextBatch(): Promise<Batch | DataStatus> {
        if (this.data.length < 4) {
            return DataStatus.EOF;
        }

        var batchLengthBytes = Buffer.from(this.data.slice(0, 4));
        this.data = this.data.slice(4);
        var startingL1BatchIndex = this.getL1BatchIndex(4);
        var batchLength = batchLengthBytes.readUInt32BE(0);
        if (this.data.length < batchLength) {
            throw new Error("BatchReader: nextBatch: not enough data");
        }

        var batchData = this.data.slice(0, batchLength);
        this.data = this.data.slice(batchLength);
        var endingL1BatchIndex = this.getL1BatchIndex(batchLength);

        var batch = this.decodeBatch(batchData);
        batch = batch as Batch;

        await this.preoracleService.postBlockIndex({
            l2BlockNumber: Number(batch.index),
            startingTransactionHash: startingL1BatchIndex.l1transactionHash,
            startingDataIndex: startingL1BatchIndex.l1transactionIndex,
            endingTransactionHash: endingL1BatchIndex.l1transactionHash,
            endingDataIndex: endingL1BatchIndex.l1transactionIndex,
        })

        return batch;
    }

    private getL1BatchIndex(index: number): {
        l1transactionHash: string;
        l1transactionIndex: number;
    } {
        this.currentIndex += index;
        const frameDataLength = this.frameInfos[this.currentFrameNumber].dataLength;
        var l1transactionHash = "";
        var l1transactionIndex = 0;


        if (this.currentIndex >= frameDataLength) {
            this.currentIndex -= frameDataLength;
            this.currentFrameNumber++;
            l1transactionHash = this.frameInfos[this.currentFrameNumber].transactionHash;
            l1transactionIndex = this.currentIndex;
        } else {
            l1transactionHash = this.frameInfos[this.currentFrameNumber].transactionHash;
            l1transactionIndex = this.currentIndex;
        }

        return {
            l1transactionHash: l1transactionHash,
            l1transactionIndex: l1transactionIndex
        };
    }

    private decodeBatch(data: Uint8Array): Batch {
        const hash = Buffer.from(data.slice(0, 64));
        data = data.slice(64);
        const index = this.uint8ArrayToBigint(data.slice(0, 8));
        data = data.slice(8);
        if (data[0] == 0) {
            data = data.slice(1);
            return {
                hash: hash.toString(),
                index: index,
                txHash: "",
                transactions: []
            }
        }
        const txHash = Buffer.from(data.slice(0, 64));
        data = data.slice(64);
        const transactions: Uint8Array[] = [];
        while (data.length > 0) {
            const txLength = this.uint8ArrayToNumber(data.slice(0, 4));
            data = data.slice(4);
            const tx = Buffer.from(data.slice(0, txLength));
            data = data.slice(txLength);
            transactions.push(tx);
        }
        return {
            hash: hash.toString(),
            index: index,
            txHash: txHash.toString(),
            transactions: transactions
        }
    }

    private uint8ArrayToNumber(data: Uint8Array): number {
        let value = 0;
        for (let i = 0; i < 4; i++) {
            value = value | data[i] << 8 * (3 - i);
        }
        return value;
    }

    private uint8ArrayToBigint(data: Uint8Array): bigint {
        let value = BigInt(0);
        for (let i = 0; i < 8; i++) {
            value = value | BigInt(data[i]) << BigInt(8 * (7 - i));
        }
        return value;
    }

    private encodeBatch(batch: Batch): Uint8Array {
        var data = new Uint8Array(0);
        const hashData = Buffer.from(batch.hash);
        data = new Uint8Array([...data, ...hashData]);
        const indexData = this.bigintToUint8Array(batch.index);
        data = new Uint8Array([...data, ...indexData]);
        if(batch.transactions.length == 0) {
            const endData = Buffer.from([0]);
            data = new Uint8Array([...data, ...endData]);
            return data;
        }
        const txHashData = Buffer.from(batch.txHash);
        data = new Uint8Array([...data, ...txHashData]);
        for (const tx of batch.transactions) {
            const txLengthData = this.numberToUint8Array(tx.length);
            data = new Uint8Array([...data, ...txLengthData]);
            const txData = Buffer.from(tx);
            data = new Uint8Array([...data, ...txData]);
        }

        return data;
    }

    private numberToUint8Array(value: number): Uint8Array {
        const data = new Uint8Array(4);
        for (let i = 0; i < 4; i++) {
            data[i] = (value >> 8 * (3 - i)) & 0xff;
        }
        return data;
    }

    private bigintToUint8Array(value: bigint): Uint8Array {
        const data = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            data[i] = Number((value >> BigInt(8 * (7 - i))) & BigInt(0xff));
        }
        return data;
    }
}