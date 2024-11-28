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

export function compareBlock(a: Block, b: Block): boolean {
    var isEqual = true;
    isEqual = isEqual && a.hash === b.hash;
    isEqual = isEqual && a.index === b.index;
    if(!a.txHash) {
        a.txHash = "";
    }
    if(!b.txHash) {
        b.txHash = "";
    }
    isEqual = isEqual && a.txHash === b.txHash;
    isEqual = isEqual && a.transactions.length === b.transactions.length;
    if(a.transactions.length > 0) {
        for(var i = 0; i < a.transactions.length; i++) {
            isEqual = isEqual && a.transactions[i].serializedPayload === b.transactions[i].serializedPayload;
        }
    }

    return isEqual;
}

export type Transaction = {
    serializedPayload: string;
}

export type BlocksInfo = { 
    blocks: Block[],
    oldestBlockIndex: bigint,
    latestBlockIndex: bigint,
}