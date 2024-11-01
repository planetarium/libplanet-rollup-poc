import { Batch, DataStatus } from "../deriver.types";

export class BatchReader{
    data: Uint8Array;
    
    constructor(data: Uint8Array){
        this.data = data;
    }

    public async nextBatch(): Promise<Batch | DataStatus> {
        if (this.data.length < 4) {
            return DataStatus.EOF;
        }

        var batchLengthBytes = Buffer.from(this.data.slice(0, 4));
        this.data = this.data.slice(4);
        var batchLength = batchLengthBytes.readUInt32BE(0);
        if (this.data.length < batchLength) {
            throw new Error("BatchReader: nextBatch: not enough data");
        }

        var batchData = this.data.slice(0, batchLength);
        this.data = this.data.slice(batchLength);

        var batchString = Buffer.from(batchData).toString();
        var batch = JSON.parse(batchString);
        batch.index = BigInt(batch.index);
        batch = batch as Batch;

        return batch;
    }

    private decodeBatch(data: Uint8Array): Batch {
        const hash = Buffer.from(data.slice(0, 32));
        data = data.slice(32);
        const index = this.uint8ArrayToBigint(data.slice(0, 8));
        data = data.slice(8);
        const txHash = Buffer.from(data.slice(0, 32));
        data = data.slice(32);
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