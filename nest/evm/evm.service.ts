import { Injectable } from "@nestjs/common";
import { MainWalletManager } from "./main.wallet.client";
import { PublicClientManager } from "./public.client";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { OutputRootProposal, WithdrawalTransaction } from "nest/9c/nc.respose.types";
import { ProposerClientManager } from "./proposer.client";
import { randomBytes } from "crypto";
import { KeyManager } from "nest/key.utils";

@Injectable()
export class EvmService {
    constructor(
        private readonly wallet: MainWalletManager,
        private readonly publicClient: PublicClientManager,
        private readonly outputRootProposeManager: ProposerClientManager,
        private readonly ncRpc: NCRpcService,
        private readonly keyManager: KeyManager,
    ) {}

    async sendTransaction(): Promise<`0x${string}`> {
        return this.wallet.sendTransaction('0x'.concat(randomBytes(32).toString('hex')) as `0x${string}`);
    }

    async sendEth(to: `0x${string}`, amount: bigint): Promise<`0x${string}`> {
        return this.outputRootProposeManager.sendTransaction(to, amount);
    }

    async depositETH(recipient: `0x${string}`, amount: bigint) {
        const txHash = await this.wallet.depositETH(recipient, amount);

        return txHash;
    }

    async proposeOutputRoot(): Promise<`0x${string}`> {
        const outputRoot = await this.ncRpc.getOutputRootProposal();
        return this.outputRootProposeManager.proposeOutputRoot(outputRoot);
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

    async getWithdrawalTransactionProofInfos(txId: string): Promise<{ 
        withdrawalTransaction: WithdrawalTransaction; 
        l2OutputIndex: bigint; 
        outputRootProposal: OutputRootProposal; 
        withdrawalProof: `0x${string}`; 
    }> {
        var txBlockIndex = await this.ncRpc.getBlockIndexWithTxId(txId); // from l2
        var latestOutputRoot = await this.publicClient.getLatestOutputRoots(); // from l1
        if (latestOutputRoot == null) {
            throw new Error('no output root found');
        }
        var latestBlockIndex = latestOutputRoot.l2BlockNumber!;
        if (txBlockIndex > latestBlockIndex) {
            throw new Error('tx is not commited yet');
        }
        var outputRootProposal = await this.ncRpc.getOutputRootProposal(latestBlockIndex);
        var withdrawalProof = await this.ncRpc.getWithdrawalProof(outputRootProposal.storageRootHash, txId);
        
        return {
            withdrawalTransaction: withdrawalProof.withdrawalInfo,
            l2OutputIndex: latestOutputRoot.l2OutputIndex!,
            outputRootProposal: outputRootProposal,
            withdrawalProof: '0x'.concat(withdrawalProof.proof) as `0x${string}`
        };
    }

    async getPrivateKey() {
        return {
            main: this.keyManager.getMainPrivateKey(),
            sub: this.keyManager.getSubPrivateKey(),
        }
    }
}