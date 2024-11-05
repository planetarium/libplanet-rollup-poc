import { Injectable } from "@nestjs/common";
import { BatchTransaction, BlockIndex } from "./preoracle.types";

type Data = {
  batch_transactions: BatchTransaction[];
  block_indices: BlockIndex[];
}

@Injectable()
export class PreoracleService {
  private db;

  public async init() {
    const { JSONFilePreset } = await import("lowdb/node");
    this.db = await JSONFilePreset<Data>('db.json', { batch_transactions: [], block_indices: [] });

    return;
  }

  public getBatchTransactionByHash(transactionHash: string) {
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

  public getBlockIndexByL2BlockNumber(l2BlockNumber: number) {
    const { block_indices } = this.db.data;
    return block_indices.find((index) => index.l2BlockNumber === l2BlockNumber);
  }

  public async postBlockIndex(blockIndex: BlockIndex) {
    if(this.getBlockIndexByL2BlockNumber(blockIndex.l2BlockNumber)) {
      return false;
    }
    await this.db.update(({ block_indices }) => block_indices.push(blockIndex));
    return true;
  }
}