import { Address } from "viem";

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
    transactions: Transaction[];
};

export type Block = {
    hash: string;
    index: bigint;
    miner: `0x${string}`;
    transactions: Transaction[];
}

export type Transaction = {
    serializedPayload: string;
};

export type OutputRootProposal = {
    blockIndex: bigint;
    stateRootHash: string;
    storageRootHash: string;
}

export type WithdrawalTransaction = {
    nonce: bigint;
    from: Address;
    to: Address;
    amount: bigint;
}