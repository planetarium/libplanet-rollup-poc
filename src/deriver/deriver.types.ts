export enum DataStatus {
    EOF,
    NotEnoughData,
    ProcessingData
}

export type BatchTransaction = {
    transactionHash: string;
    data: Uint8Array;
  }

export type ChannelID = Uint8Array;

export type ChannelData = {
    data: Uint8Array;
    frameInfos: FrameInfo[];
}

export type FrameInfo = {
    transactionHash: string;
    dataLength: number;
}

export type Frame = {
    id: ChannelID;
    frameNumber: number;
    data: Uint8Array;
    isLast: boolean;

    transactionHash: string;
    dataLength: number;
}

export type Batch = {
    hash: string;
    index: bigint;
    txHash: string;
    transactions: Uint8Array[];
}

export type Block = {
    hash: string;
    index: bigint;
    txHash: string;
    transactions: Transaction[];
}

export type Transaction = {
    serializedPayload: string;
}

export type BlocksInfo = { 
    blocks: Block[],
    oldestBlockIndex: bigint,
    latestBlockIndex: bigint,
}