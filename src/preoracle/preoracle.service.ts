import { Injectable } from "@nestjs/common";
import { BatchTransaction } from "./preoracle.types";

@Injectable()
export class PreoracleService {
  private db;

  public async init() {
    const { JSONFilePreset } = await import("lowdb/node");
    this.db = await JSONFilePreset('db.json', { batch_transactions: [], block_indices: [] });
    return;
  }

  public getBatchTransactionByHash(transactionHash: string) {
    const { batch_transactions } = this.db.data;
    return batch_transactions.find((tx) => tx.transactionHash === transactionHash);
  }

  public async postBatchTransaction(batchTransacion: BatchTransaction) {
    await this.db.update(({ batch_transactions }) => batch_transactions.push(batchTransacion));
    return true;
  }
}