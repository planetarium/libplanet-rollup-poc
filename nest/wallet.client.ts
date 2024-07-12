import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { abi as txParserAbi } from './abi/TransactionParser';
import { exportPrivateKeyFromKeyStore } from './key.utils';

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
      client: this.GetClient(),
    });
    return txParserContract.write.parseTransactionFromSerializedPayload([serializedPayload], {});
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
