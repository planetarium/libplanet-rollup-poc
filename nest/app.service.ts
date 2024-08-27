import { Injectable } from "@nestjs/common";
import { WalletManager } from "./evm/wallet.client";
import { NCRpcService } from "./9c/nc.rpc.service";
import { PublicClientManager } from "./evm/public.client";
import { KeyManager } from "./key.utils";
import { Address } from "viem";
import { OutputRootProposal, WithdrawalTransaction } from "./9c/nc.respose.types";

@Injectable()
export class AppService {
    constructor(
        private readonly wallet: WalletManager,
        private readonly publicClient: PublicClientManager,
        private readonly ncRpc: NCRpcService,
        private readonly keyManager: KeyManager,
    ) {}

    async getBalancesForWeb() {
        const firstAddress = '0xCE70F2e49927D431234BFc8D439412eef3a6276b';
        const secondAddress = '0xaA2337b6FC4EDcc99FBDc9dee5973c94849dCEce';

        var l1FistAddressBalance = await this.publicClient.getBalance(firstAddress);
        var l1SecondAddressBalance = await this.publicClient.getBalance(secondAddress);

        var l2FirstAddressBalance = await this.ncRpc.getWethBalanceFromLocal(firstAddress);
        var l2SecondAddressBalance = await this.ncRpc.getWethBalanceFromLocal(secondAddress);

        var res = {
            l1FirstAddressBalance: l1FistAddressBalance.toString(),
            l1SecondAddressBalance: l1SecondAddressBalance.toString(),
            l2FirstAddressBalance: l2FirstAddressBalance.toString(),
            l2SecondAddressBalance: l2SecondAddressBalance.toString()
        };

        return res;
    }

    async getLatestOutputRoots() {
        var res = await this.publicClient.getLatestOutputRoots();
        if(res == undefined) {
            return null;
        }
        var outputRootInfo = {
            outputRoot: res.outputRoot,
            l2OutputIndex: res.l2OutputIndex?.toString(),
            l2BlockNumber: res.l2BlockNumber?.toString(),
            l1Timestamp: res.l1Timestamp?.toString(),
        }
        return outputRootInfo;
    }

    async withdrawETH(from: `main` | `sub`, recipient: Address, amount: bigint) {
        if(from == `main`) {
            return this.ncRpc.withdrawEthToLocalNetwork(
                this.keyManager.getPrivateKeyFromKeyStore(),
                recipient,
                amount
            );
        } else {
            return this.ncRpc.withdrawEthToLocalNetwork(
                this.keyManager.getSubPrivateKeyFromKeyStore(),
                recipient, 
                amount
            );
        }
    }

    async getWithdrawalTransactionProofInfos(txId: string): Promise<{ 
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