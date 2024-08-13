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

export type Transaction = {
    serializedPayload: string;
}