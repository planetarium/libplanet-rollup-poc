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