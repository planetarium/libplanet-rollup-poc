import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract, Address, sha256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { abi as txParserAbi } from './abi/TransactionParser';
import { abi as hasParserAbi } from './abi/HackAndSlashParser';
import { abi as txProcessorAbi } from './abi/LibplanetTransactionProcessor';
import { abi as txResultStoreAbi } from './abi/LibplanetTransactionResultsStore';
import { abi as proofVerifierAbi } from './abi/LibplanetProofVerifier';
import { abi as outputOracleAbi } from './abi/LibplanetOutputOracle';
import { KeyManager } from './key.utils';
import { TransactionResult, TxStatus, TransactionStruct, TransactionWorldProof, OutputRootProposal, WithdrawalTransaction } from './9c/nc.respose.models';

@Injectable()
export class WalletManager {
  constructor(
    private configure: ConfigService,
    private keyManager: KeyManager,
  ) {}

  private readonly logger = new Logger(WalletManager.name);

  private readonly chain = this.GetChain(this.configure.get('wallet.chain', 'localhost'));
  private readonly client = this.GetClient();

  async sendTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return this.client.sendTransaction({
      to: this.client.account.address,
      data: payload,
    });
  }

  async depositETH(recipient: Address, amount: bigint): Promise<`0x${string}`> {
    const bridgeContract = getContract({
      address: (this.chain.contracts?.libplanetBridge as ChainContract).address,
      abi: bridgeAbi,
      client: this.client,
    });
    return bridgeContract.write.depositETH(
      [
        this.client.account.address,
        recipient,
        amount,
      ],
      {
        value: amount,
      },
    );
  }

  async parseTx(serializedPayload: `0x${string}`): Promise<`0x${string}`> {
    const txParserContract = getContract({
      address: (this.chain.contracts?.transactionParser as ChainContract).address,
      abi: txParserAbi,
      client: this.client,
    });
    return txParserContract.write.parseTransactionFromSerializedPayload([serializedPayload], {});
  }

  async parseTxs(blockIndex: bigint, serializedPayloads: `0x${string}`[]): Promise<`0x${string}`> {
    const txParserContract = getContract({
      address: (this.chain.contracts?.libplanetTransactionProcessor as ChainContract).address,
      abi: txProcessorAbi,
      client: this.client,
    });
    return txParserContract.write.processTransaction([blockIndex, serializedPayloads], {});
  }

  async parseHackAndSlash(serializedPayload: `0x${string}`): Promise<`0x${string}`> {
    const hasParserContract = getContract({
      address: (this.chain.contracts?.hackAndSlashParser as ChainContract).address,
      abi: hasParserAbi,
      client: this.client,
    });
    return hasParserContract.write.parseHackAndSlashFromSerializedPayload([serializedPayload], {});
  }

  async storeTxResult(txResult: TransactionResult): Promise<`0x${string}`> {
    const txResultStoreContract = getContract({
      address: (this.chain.contracts?.libplanetTransactionResultsStore as ChainContract).address,
      abi: txResultStoreAbi,
      client: this.client,
    });
    return txResultStoreContract.write.storeTxResult([
      txResult.blockIndex,
      '0x'.concat(txResult.txId) as `0x${string}`,
      {
        txStatus: TxStatus[txResult.txStatus as keyof typeof TxStatus],
        blockHash: '0x'.concat(txResult.blockHash) as `0x${string}`,
        inputState: '0x'.concat(txResult.inputState) as `0x${string}`,
        outputState: '0x'.concat(txResult.outputState) as `0x${string}`,
      }
    ], {});
  }

  async verifyTxProof(txWorldProof: TransactionWorldProof): Promise<`0x${string}`> {
    const proofVerifierContract = getContract({
      address: (this.chain.contracts?.libplanetProofVerifier as ChainContract).address,
      abi: proofVerifierAbi,
      client: this.client,
    });
    return proofVerifierContract.write.verifyProof([
      '0x'.concat(txWorldProof.txId) as `0x${string}`,
      '0x'.concat(txWorldProof.stateRootHash) as `0x${string}`,
      '0x'.concat(txWorldProof.proof) as `0x${string}`,
      '0x'.concat(txWorldProof.key) as `0x${string}`,
      '0x'.concat(txWorldProof.value) as `0x${string}`,
    ], {});
  }

  async proposeOutputRoot(outputRootProposal: OutputRootProposal): Promise<`0x${string}`> {
    const outputOracleContract = getContract({
      address: (this.chain.contracts?.libplanetOutputOracle as ChainContract).address,
      abi: outputOracleAbi,
      client: this.client,
    });
    
    var stateRootHash = Uint8Array.from(Buffer.from(outputRootProposal.stateRootHash, 'hex'));
    var storageRootHash = Uint8Array.from(Buffer.from(outputRootProposal.storageRootHash, 'hex'));
    
    var outputRootArray = new Uint8Array(64);
    outputRootArray.set(stateRootHash, 0);
    outputRootArray.set(storageRootHash, 32);  

    var outputRoot = sha256(outputRootArray);

    var blockIndex = BigInt(outputRootProposal.blockIndex);

    return outputOracleContract.write.proposeL2Output([
      outputRoot,
      blockIndex,
    ])
  }

  async proveWithdrawalTransaction(
    withdrawalTransaction: WithdrawalTransaction,
    l2OutputIndex: bigint,
    outputRootProposal: OutputRootProposal,
    withdrawalProof: `0x${string}`,
  ): Promise<`0x${string}`> {
    const portalContract = getContract({
      address: (this.chain.contracts?.libplanetPortal as ChainContract).address,
      abi: portalAbi,
      client: this.client,
    });
    return portalContract.write.proveWithdrawalTransaction([
      withdrawalTransaction,
      l2OutputIndex,
      {
        stateRoot: '0x'.concat(outputRootProposal.stateRootHash) as `0x${string}`,
        storageRoot: '0x'.concat(outputRootProposal.storageRootHash) as `0x${string}`,
      },
      withdrawalProof,
    ]);
  }

  async finalizeWithdrawalTransaction(
    withdrawalTransaction: WithdrawalTransaction,
  ): Promise<`0x${string}`> {
    const portalContract = getContract({
      address: (this.chain.contracts?.libplanetPortal as ChainContract).address,
      abi: portalAbi,
      client: this.client,
    });
    return portalContract.write.finalizeWithdrawalTransaction([
      withdrawalTransaction
    ]);
  }

  private GetChain(chain: string): Chain {
    switch (chain) {
      case 'mothership':
        return mothership;
      case 'opSepolia':
        return opSepolia;
      case 'localhost':
        return localhost(this.configure);
      default:
        throw new Error('Invalid chain');
    }
  }

  private GetClient() {
    const account = privateKeyToAccount(
      this.chain.name === 'localhost' ?
      this.keyManager.getPrivateKeyFromKeyStore() :
      this.configure.get('wallet.private_key') as `0x${string}`,
    );
    return createWalletClient({
      chain: this.chain,
      account: account,
      transport: http(),
    });
  }
}
