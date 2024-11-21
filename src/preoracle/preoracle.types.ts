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

export function blockIndexToBufferArray(blockIndex: BlockIndex): Buffer[] {
  return [
    Buffer.from(blockIndex.l2BlockNumber.toString(16), 'hex'),
    Buffer.from(blockIndex.startingTransactionHash),
    Buffer.from(blockIndex.startingDataIndex.toString(16), 'hex'),
    Buffer.from(blockIndex.endingTransactionHash),
    Buffer.from(blockIndex.endingDataIndex.toString(16), 'hex'),
  ];  
}