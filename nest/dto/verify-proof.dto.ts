import { TransactionWorldProof } from "nest/9c/nc.respose.models";

export class  VerifyProofDto {
    txId: string;
    stateRootHash: string;
    proof: string;
    key: string;
    value: string;

    constructor (txId: string, stateRootHash: string, proof: string, key: string, value: string) {
        this.txId = txId;
        this.stateRootHash = stateRootHash;
        this.proof = proof;
        this.key = key;
        this.value = value;
    }

    public toTransactionWorldProof(): TransactionWorldProof {
        return {
            txId: this.txId,
            stateRootHash: this.stateRootHash,
            proof: this.proof,
            key: this.key,
            value: this.value
        }
    }
}