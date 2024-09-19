import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract, Address, sha256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { KeyManager } from '../key.utils';
import { OutputRootProposal, WithdrawalTransaction } from '../9c/nc.respose.types';
import { ChainManager } from './evm.chains';

@Injectable()
export class WalletClientManager {
  constructor(
    private readonly keyManager: KeyManager,
    private readonly chainManger: ChainManager,
  ) {}

  private readonly logger = new Logger(WalletClientManager.name);

  private readonly chain = this.chainManger.getChain();

  async sendTransaction(from: `0x${string}`, payload: `0x${string}`): Promise<`0x${string}`> {
    const client = this.getClient(from);
    return await client.sendTransaction({
      to: client.account.address,
      data: payload,
    });
  }

  async depositETH(from: `0x${string}`, recipient: Address, amount: bigint): Promise<`0x${string}`> {
    const client = this.getClient(from);
    const bridgeContract = getContract({
      address: (this.chain.contracts?.libplanetBridge as ChainContract).address,
      abi: bridgeAbi,
      client: client,
    });
    return await bridgeContract.write.depositETH(
      [
        client.account.address,
        recipient,
        amount,
      ],
      {
        value: amount,
      },
    );
  }

  private getClient(privateKey: `0x${string}`) {
    const account = privateKeyToAccount(privateKey);
    return createWalletClient({
      chain: this.chain,
      account: account,
      transport: http(),
    });
  }
}
