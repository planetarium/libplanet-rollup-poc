export type BlockID = {
    hash: string;
    index: bigint;
}

export type Block = {
    hash: string;
    index: bigint;
    miner: `0x${string}`;
    transactions: Transaction[];
}

export type Batch = {
    hash: string;
    index: bigint;
    miner: `0x${string}`;
    transactions: Uint8Array[];
}

export type Transaction = {
    serializedPayload: string;
}

export type ChannelID = Uint8Array;

export type FrameID = {
    channelID: ChannelID;
    frameNumber: number;
}

export type FrameData = {
    id: FrameID;
    data: Uint8Array;
}

export type TxData = {
    frames: FrameData[];
}

export type Frame = {
    id: ChannelID;
    frameNumber: number;
    data: Uint8Array;
    isLast: boolean;
}

export type BlockRange = {
    start: BlockID;
    end: BlockID;
}