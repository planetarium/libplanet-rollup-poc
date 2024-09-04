import { Injectable } from "@nestjs/common";
import { WalletManager } from "./wallet.client";
import { PublicClientManager } from "./public.client";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { OutputRootProposal, WithdrawalTransaction } from "nest/9c/nc.respose.types";
import { OutputRootProposeManager } from "./propose.client";
import { randomBytes } from "crypto";

@Injectable()
export class EvmService {
    constructor(
        private readonly wallet: WalletManager,
        private readonly publicClient: PublicClientManager,
        private readonly outputRootProposeManager: OutputRootProposeManager,
        private readonly ncRpc: NCRpcService
    ) {}

    async sendTransaction(): Promise<`0x${string}`> {
        return this.wallet.sendTransaction('0x'.concat(randomBytes(32).toString('hex')) as `0x${string}`);
    }

    async depositETH(recipient: `0x${string}`, amount: bigint): Promise<`0x${string}`> {
        return this.wallet.depositETH(recipient, amount);
    }

    async proposeOutputRoot(): Promise<`0x${string}`> {
        const outputRoot = await this.ncRpc.getOutputRootProposalFromLocalNetwork();
        return this.outputRootProposeManager.propose(outputRoot);
    }

    async proveWithdrawal(txId: string): Promise<`0x${string}`> {
        var withdrawalTransactionProofInfos = await this.getWithdrawalTransactionProofInfos(txId);
        var res = await this.wallet.proveWithdrawalTransaction(
            withdrawalTransactionProofInfos.withdrawalTransaction,
            withdrawalTransactionProofInfos.l2OutputIndex,
            withdrawalTransactionProofInfos.outputRootProposal,
            withdrawalTransactionProofInfos.withdrawalProof
        );
        return res;
    }

    async finalizeWithdrawal(txId: string): Promise<`0x${string}`> {
        var withdrawalTransactionProofInfos = await this.getWithdrawalTransactionProofInfos(txId);
        var res = await this.wallet.finalizeWithdrawalTransaction(
            withdrawalTransactionProofInfos.withdrawalTransaction);
        return res;
    }

    async getBalance(address: `0x${string}`): Promise<bigint> {
        return this.publicClient.getBalance(address);
    }

    private async getWithdrawalTransactionProofInfos(txId: string): Promise<{ 
        withdrawalTransaction: WithdrawalTransaction; 
        l2OutputIndex: bigint; 
        outputRootProposal: OutputRootProposal; 
        withdrawalProof: `0x${string}`; 
    }> {
        var txBlockIndex = await this.ncRpc.getBlockIndexWithTxIdFromLocalNetwork(txId); // from l2
        var latestOutputRoot = await this.publicClient.getLatestOutputRoots(); // from l1
        if (latestOutputRoot == null) {
            throw new Error('no output root found');
        }
        var latestBlockIndex = latestOutputRoot.l2BlockNumber!;
        if (txBlockIndex > latestBlockIndex) {
            throw new Error('tx is not commited yet');
        }
        var outputRootProposal = await this.ncRpc.getOutputRootProposalFromLocalNetwork(latestBlockIndex);
        var withdrawalProof = await this.ncRpc.getWithdrawalProofFromLocalNetwork(outputRootProposal.storageRootHash, txId);
        
        return {
            withdrawalTransaction: withdrawalProof.withdrawalInfo,
            l2OutputIndex: latestOutputRoot.l2OutputIndex!,
            outputRootProposal: outputRootProposal,
            withdrawalProof: '0x'.concat(withdrawalProof.proof) as `0x${string}`
        };
    }
}