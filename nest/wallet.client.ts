import { Injectable, Logger } from '@nestjs/common';
import {
  createWalletClient,
  http,
  Chain,
  PrivateKeyAccount,
  parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { opSepolia, mothership } from './chains';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletManager {
  constructor(private configure: ConfigService) {
    this.account = privateKeyToAccount(configure.get('wallet.private_key'));
    this.client = createWalletClient({
      chain: this.GetChain(configure.get('wallet.chain')),
      account: this.account,
      transport: http(),
    });
  }

  private readonly logger = new Logger('WalletClient');

  private account: PrivateKeyAccount;
  private client;

  async sendTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return this.client.sendTransaction({
      account: this.account,
      to: this.account.address,
      data: payload,
    });
  }

  private GetChain(chain: string): Chain {
    switch (chain) {
      case 'mothership':
        return mothership;
      case 'opSepolia':
        return opSepolia;
      default:
        throw new Error('Invalid chain');
    }
  }
}
