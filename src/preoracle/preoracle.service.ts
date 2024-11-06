import { Injectable } from "@nestjs/common";
import { BatchTransaction, BlockIndex } from "./preoracle.types";
import { Batch, Block, compareBlock } from "src/deriver/deriver.types";
import { LibplanetService } from "src/libplanet/libplanet.service";

type Data = {
  batch_transactions: BatchTransaction[];
  block_indices: BlockIndex[];
}

@Injectable()
export class PreoracleService {
  constructor(
    private readonly libplanetService: LibplanetService,
  ) {}

  private db;

  private readonly FRAME_PRE_INFO_SIZE = 22;
  private readonly FRAME_POST_INFO_SIZE = 1;

  public async init() {
    const { JSONFilePreset } = await import("lowdb/node");
    this.db = await JSONFilePreset<Data>('db.json', { batch_transactions: [], block_indices: [] });

    await this.dbSanityCheck();

    return;
  }

  public getBatchTransactionByHash(transactionHash: string): BatchTransaction {
    const { batch_transactions } = this.db.data;
    return batch_transactions.find((tx) => tx.transactionHash === transactionHash);
  }

  public async postBatchTransaction(batchTransacion: BatchTransaction) {
    if(this.getBatchTransactionByHash(batchTransacion.transactionHash)) {
      return false;
    }
    await this.db.update(({ batch_transactions }) => batch_transactions.push(batchTransacion));
    return true;
  }

  public getBlockIndexByL2BlockNumber(l2BlockNumber: number): BlockIndex {
    const { block_indices } = this.db.data;
    return block_indices.find((index) => index.l2BlockNumber === l2BlockNumber);
  }

  public countBlockIndices(): number {
    const { block_indices } = this.db.data;
    return block_indices.length;
  }

  public async postBlockIndex(blockIndex: BlockIndex) {
    if(this.getBlockIndexByL2BlockNumber(blockIndex.l2BlockNumber)) {
      return false;
    }
    await this.db.update(({ block_indices }) => block_indices.push(blockIndex));
    return true;
  }

  private async dbSanityCheck() {
    const blockIndicesNumber = this.countBlockIndices();
    for(let i = 1; i <= blockIndicesNumber; i++) {
      const blockIndex = this.getBlockIndexByL2BlockNumber(i);
      if(!blockIndex) {
        throw new Error('Block index not found');
      }

      var data = new Uint8Array(0);
      if(blockIndex.startingTransactionHash === blockIndex.endingTransactionHash) {
        const batchTransaction = this.getBatchTransactionByHash(blockIndex.startingTransactionHash);
        if(!batchTransaction) {
          throw new Error('Batch transaction not found');
        }
        const dataString = batchTransaction.data;
        const dataBuffer = Buffer.from(dataString, 'hex');
        var dataArray = Uint8Array.from(dataBuffer);
        dataArray = dataArray.slice(
          blockIndex.startingDataIndex + this.FRAME_PRE_INFO_SIZE,
          blockIndex.endingDataIndex + this.FRAME_PRE_INFO_SIZE
        );
        data = new Uint8Array([...data, ...dataArray]);
      } else {
        const startingBatchTransaction = this.getBatchTransactionByHash(blockIndex.startingTransactionHash);
        if(!startingBatchTransaction) {
          throw new Error('Batch transaction not found');
        }
        const startingDataString = startingBatchTransaction.data;
        const startingDataBuffer = Buffer.from(startingDataString, 'hex');
        var startingDataArray = Uint8Array.from(startingDataBuffer);
        startingDataArray = startingDataArray.slice(
          blockIndex.startingDataIndex + this.FRAME_PRE_INFO_SIZE,
          startingDataArray.length - this.FRAME_POST_INFO_SIZE
        );
        data = new Uint8Array([...data, ...startingDataArray]);

        const endingBatchTransaction = this.getBatchTransactionByHash(blockIndex.endingTransactionHash);
        if(!endingBatchTransaction) {
          throw new Error('Batch transaction not found');
        }
        const endingDataString = endingBatchTransaction.data;
        const endingDataBuffer = Buffer.from(endingDataString, 'hex');
        var endingDataArray = Uint8Array.from(endingDataBuffer);
        endingDataArray = endingDataArray.slice(
          this.FRAME_PRE_INFO_SIZE, 
          blockIndex.endingDataIndex + this.FRAME_PRE_INFO_SIZE
        );
        data = new Uint8Array([...data, ...endingDataArray]);
      }

      const batch = this.decodeBatch(data);
      const block = this.batchToBlock(batch);
      
      const comparedBlock = await this.libplanetService.getBlockByIndex(block.index);
      if(!comparedBlock.txHash) {
        comparedBlock.txHash = "";
      }
      if(!compareBlock(block, comparedBlock)) {
        throw new Error('Block data not matched');
      }
    }
  }

  private batchToBlock(batch: Batch): Block {
    return {
        hash: batch.hash,
        index: batch.index,
        txHash: batch.txHash,
        transactions: batch.transactions.map(tx => {
            return {
                serializedPayload: Buffer.from(tx).toString('base64'),
            }
        }),
    }
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
}