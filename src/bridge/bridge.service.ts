import { Injectable } from "@nestjs/common";
import { LibplanetBridgeAbi } from "src/evm/abis/LibplanetBridge.abi";
import { LibplanetPortalAbi } from "src/evm/abis/LibplanetPortal.abi";
import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmPublicService } from "src/evm/evm.public.service";
import { LibplanetService } from "src/libplanet/libplanet.service";
import { parseAbiItem, parseEventLogs, TransactionExecutionError } from "viem";
import { ChallengerService } from "src/challenger/challenger.service";
import { OutputRootProof, WithdrawalTransaction } from "./bridge.types";

@Injectable()
export class BridgeService {
  constructor(
    private readonly evmClientFactory: EvmClientFactory,
    private readonly evmContractManager: EvmContractManager,
    private readonly evmPublicService: EvmPublicService,
    private readonly libplanetService: LibplanetService,
    private readonly challengerService: ChallengerService,
  ) {}

  public async getBalance(privateKey: `0x${string}`) {
    const address = this.evmClientFactory.getWalletClient(privateKey).account.address;
    const l2Eth = await this.evmPublicService.getBalance(address);
    const l3Weth = await this.libplanetService.getWethBalance(address);

    return {
      l2Eth: l2Eth.toString(),
      l3Weth: l3Weth.toString(),
    }
  }

  public async depositEth(
    privateKey: `0x${string}`,
    receipient: `0x${string}`,
    amount: bigint,
  ) {
    const walletClient = this.evmClientFactory.getWalletClient(privateKey);
    const libplanetBridge = this.evmContractManager.getLibplanetBridge(privateKey);
    const txHash = await libplanetBridge.write.depositETH([
      walletClient.account.address,
      receipient,
      amount
    ], {
      value: amount,
    });
    const receipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
    const event = parseEventLogs({
        abi: LibplanetPortalAbi,
        eventName: 'EthDeposited',
        logs: receipt.logs
    })[0].args;

    const isMinted = await this.libplanetService.mintWeth(event.to, event.amount);

    if(!isMinted) {
      throw new Error('WETH mint failed');
    }

    return "success";
  }

  public async withdrawEth(
    privateKey: `0x${string}`,
    receipient: `0x${string}`,
    amount: bigint,
  ) {
    const txId = await this.libplanetService.withdrawEth(privateKey, receipient, amount);
    const txResult = await this.libplanetService.getTransactionResult(txId);
    return {
      l3TxId: txId,
      l3TxResult: {
        blockIndex: txResult.blockIndex.toString(),
        blockHash: txResult.blockHash,
        outputState: txResult.outputState,
      }
    }
  }

  public async proveWithdrawal(
    privateKey: `0x${string}`,
    txId: string,
  ) {
    const libplanetPortal = this.evmContractManager.getLibplanetPortal(privateKey);
    
    var txHash: `0x${string}`;
    try {
      const withdrawalProofInfos = await this.getWithdrawalTransactionProofInfos(txId);
      txHash = await libplanetPortal.write.proveWithdrawalTransaction([
        withdrawalProofInfos.tx,
        withdrawalProofInfos.disputeGameIndex,
        withdrawalProofInfos.outputRootProof,
        withdrawalProofInfos.withdrawalProof
      ]);
    } catch (e) {
      if(e instanceof TransactionExecutionError) {
        return e.shortMessage;
      } else {
        const error = e as Error;
        return error.toString();
      }
    }
    const receipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
    const event = parseEventLogs({
        abi: LibplanetPortalAbi,
        eventName: 'WithdrawalProven',
        logs: receipt.logs
    })[0].args;
    return {
      txId: txId,
      withdrawalHash: event.withdrawalHash,
      proofSubmitter: event.proofSubmitter,
      gameIndex: event.gameIndex.toString(),
      from: event.from,
      to: event.to,
      amount: event.amount.toString(),
    }
  }

  private async getWithdrawalTransactionProofInfos(txId: string) {
    const l3TxResult = await this.libplanetService.getTransactionResult(txId);
    const l3TxBlockIndex = l3TxResult.blockIndex;
    const recentHonestDisputeGame = await this.challengerService.getRecentHonestDisputeGame();
    if (recentHonestDisputeGame.l2BlockNumber <= l3TxBlockIndex) {
      throw new Error('tx is not commited yet');
    }
    const outputRootProof = await this.libplanetService.getOutputRootProof(recentHonestDisputeGame.l2BlockNumber);
    const withdrawalProof = await this.libplanetService.getWithdrawalProof(outputRootProof.storageRootHash, txId);
    
    return {
      tx: withdrawalProof.withdrawalInfo as WithdrawalTransaction,
      disputeGameIndex: BigInt(recentHonestDisputeGame.index),
      outputRootProof: {
        stateRoot: `0x${outputRootProof.stateRootHash}`,
        storageRoot: `0x${outputRootProof.storageRootHash}`,
      } as OutputRootProof,
      withdrawalProof: `0x${withdrawalProof.proof}` as `0x${string}`,
    };
  }

  public async finalizeWithdrawal(
    privateKey: `0x${string}`,
    txId: string,
    proofSubmitter: `0x${string}`,
  ) {
    const libplanetPortal = this.evmContractManager.getLibplanetPortal(privateKey);
    const withdrawalProofInfos = await this.getWithdrawalTransactionProofInfos(txId);
    var txHash: `0x${string}`;
    try {
      txHash = await libplanetPortal.write.finalizeWithdrawalTransaction([
        withdrawalProofInfos.tx,
        proofSubmitter,
      ]);
    } catch (e) {
      const error = e as TransactionExecutionError;
      return error.shortMessage;
    }
    const receipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
    const event = parseEventLogs({
        abi: LibplanetPortalAbi,
        eventName: 'WithdrawalFinalized',
        logs: receipt.logs
    })[0].args;
    return {
      txId: txId,
      withdrawalHash: event.withdrawalHash,
      success: event.success, 
    }
  }
}