import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { abi as txParserAbi } from './abi/TransactionParser';
import { abi as hasParserAbi } from './abi/HackAndSlashParser';
import { abi as txProcessorAbi } from './abi/LibplanetTransactionProcessor';
import { abi as txResultStoreAbi } from './abi/LibplanetTransactionResultsStore';
import { exportPrivateKeyFromKeyStore } from './key.utils';
import { TransactionResult, TxStatus } from './9c/nc.transactionResult.model';

@Injectable()
export class WalletManager {
  constructor(private configure: ConfigService) {}

  private readonly logger = new Logger(WalletManager.name);

  private readonly chain = this.GetChain(this.configure.get('wallet.chain', 'localhost'));
  private readonly client = this.GetClient();

  async sendTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return this.client.sendTransaction({
      to: this.client.account.address,
      data: payload,
    });
  }

  async depositETH(amount: number): Promise<`0x${string}`> {
    const bridgeContract = getContract({
      address: (this.chain.contracts?.libplanetBridge as ChainContract).address,
      abi: bridgeAbi,
      client: this.client,
    });
    return bridgeContract.write.depositETH(
      [
        this.client.account.address,
        (this.chain.contracts?.libplanetPortal as ChainContract).address,
        BigInt(amount),
      ],
      {
        value: BigInt(amount),
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
      exportPrivateKeyFromKeyStore(
        this.configure.get('wallet.keystore.path', ''),
        this.configure.get('wallet.keystore.password', ''),
      ) :
      this.configure.get('wallet.private_key') as `0x${string}`,
    );
    return createWalletClient({
      chain: this.chain,
      account: account,
      transport: http(),
    });
  }
}
