export enum DataStatus {
    EOF,
    NotEnoughData,
    ProcessingData
}

export type ChannelID = Uint8Array;

export type Frame = {
    id: ChannelID;
    frameNumber: number;
    data: Uint8Array;
    isLast: boolean;
}

export type Batch = {
    hash: string;
    index: bigint;
    miner: `0x${string}`;
    transactions: Uint8Array[];
}

export type Block = {
    hash: string;
    index: bigint;
    miner: `0x${string}`;
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