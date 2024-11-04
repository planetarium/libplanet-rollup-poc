export type BatchTransaction = {
  transactionHash: string;
  data: Uint8Array;
}

export type BlockIndex = {
  startingTransactionHash: string;
  startingDataIndex: number;
  endingTransactionHash: string;
  endingDataIndex: number;
}

