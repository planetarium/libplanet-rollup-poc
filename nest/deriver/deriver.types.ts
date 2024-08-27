export enum DataStatus {
    EOF,
    NotEnoughData,
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