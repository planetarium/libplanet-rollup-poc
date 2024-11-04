export type BatchTransaction = {
  transactionHash: string;
  data: string;
}

export type BlockIndex = {
  l2BlockNumber: number;
  startingTransactionHash: string;
  startingDataIndex: number;
  endingTransactionHash: string;
  endingDataIndex: number;
}

