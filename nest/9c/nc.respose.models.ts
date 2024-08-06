export enum TxStatus {
    INVALID,
    STAGING,
    SUCCESS,
    FAILURE,
    INCLUDED
}

export type TransactionResult = {
    txId: string;
    txStatus: string;
    blockIndex: bigint;
    blockHash: string;
    inputState: string;
    outputState: string;
}

export type TransactionWorldProof = {
    txId: string;
    stateRootHash: string;
    proof: string;
    key: string;
    value: string;
}

export type BlockStruct = {
    index: number;
    hash: string;
    miner: string;
};

export type BlockWithTransactionsStruct = {
    index: number;
    transactions: TransactionStruct[];
};

export type TransactionStruct = {
    serializedPayload: string;
};

export type OutputRootProposal = {
    blockIndex: bigint;
    stateRootHash: string;
    storageRootHash: string;
}