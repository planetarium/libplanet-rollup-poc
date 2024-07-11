import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mothership, opSepolia, geth } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { exportPrivateKeyFromKeyStore } from './key.utils';

@Injectable()
export class WalletManager {
  constructor(private configure: ConfigService) {}

  private readonly logger = new Logger(WalletManager.name);

  async sendTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return this.GetClient().sendTransaction({
      to: this.GetClient().account.address,
      data: payload,
    });
  }

  async depositETH(amount: number): Promise<`0x${string}`> {
    const bridgeContract = getContract({
      address: `0x13D12eE50497944666D0C9140c3cc12b6E80376b`,
      abi: bridgeAbi,
      client: this.GetClient(),
    });
    return bridgeContract.write.depositETH(
      [
        `0x2B4405b5a70cD162DBa3544e1B4a1Cf12Fd2e7d8`,
        `0x99DF57BF45240C8a87615B0C884007501395d526`,
        BigInt(amount),
      ],
      {
        value: BigInt(amount),
      },
    );
  }

  private GetClient() {
    const account = privateKeyToAccount(
      this.configure.get('wallet.private_key') as `0x${string}`,
    );
    return createWalletClient({
      chain: this.GetChain(this.configure.get('wallet.chain', 'mothership')),
      account: account,
      transport: http(),
    });
  }

  async gethSendTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return this.GethGetClient().sendTransaction({
      to: this.GethGetClient().account.address,
      data: payload,
    });
  }

  async gethDepositETH(amount: number): Promise<`0x${string}`> {
    const bridgeContract = getContract({
      address: `0x0C22fa4e64ec155453941ae2c946A259a8700Fdd`,
      abi: bridgeAbi,
      client: this.GethGetClient(),
    });
    return bridgeContract.write.depositETH(
      [
        `0xCE70F2e49927D431234BFc8D439412eef3a6276b`,
        `0x30Ba69479c1869a5EF3A612e4888EF84122Ceaba`,
        BigInt(amount),
      ],
      {
        value: BigInt(amount),
      },
    );
  }

  private GethGetClient() {
    const account = privateKeyToAccount(
      exportPrivateKeyFromKeyStore(
        this.configure.get('wallet.keystore_path_from_home', ''),
        this.configure.get('wallet.keystore_password', ''),
      ),
    );
    return createWalletClient({
      chain: this.GetChain(this.configure.get('wallet.chain', 'geth')),
      account: account,
      transport: http(),
    });
  }

  private GetChain(chain: string): Chain {
    switch (chain) {
      case 'mothership':
        return mothership;
      case 'opSepolia':
        return opSepolia;
      case 'geth':
        return geth;
      default:
        throw new Error('Invalid chain');
    }
  }
}
