import { toHex } from "viem";

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
    Buffer.from(numberToHex(blockIndex.l2BlockNumber), 'hex'),
    Buffer.from(blockIndex.startingTransactionHash.slice(2), 'hex'),
    Buffer.from(numberToHex(blockIndex.startingDataIndex), 'hex'),
    Buffer.from(blockIndex.endingTransactionHash.slice(2), 'hex'),
    Buffer.from(numberToHex(blockIndex.endingDataIndex), 'hex'),
  ];  
}

function numberToHex(n: number): string {
  const hexString = n.toString(16);
  return hexString.length % 2 ? `0${hexString}` : hexString;
}