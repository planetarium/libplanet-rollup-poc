import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract, Address, sha256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { abi as outputOracleAbi } from './abi/LibplanetOutputOracle';
import { KeyManager } from '../key.utils';
import { OutputRootProposal, WithdrawalTransaction } from '../9c/nc.respose.types';

@Injectable()
export class WalletManager {
  constructor(
    private configure: ConfigService,
    private keyManager: KeyManager,
  ) {}

  private readonly logger = new Logger(WalletManager.name);

  private readonly chain = this.getChain(this.configure.get('wallet.chain', 'localhost'));
  private client = this.getMainClient();

  public getCurrentAddress() {
    return this.client.account.address;
  }

  async sendTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return await this.client.sendTransaction({
      to: this.client.account.address,
      data: payload,
    });
  }

  async batchTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return await this.client.sendTransaction({
      to: this.configure.get('local_contract_address.libplanet_batch_inbox') as `0x${string}`,
      data: payload,
    });
  }

  async depositETH(recipient: Address, amount: bigint): Promise<`0x${string}`> {
    const bridgeContract = getContract({
      address: (this.chain.contracts?.libplanetBridge as ChainContract).address,
      abi: bridgeAbi,
      client: this.client,
    });
    return await bridgeContract.write.depositETH(
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
    return await portalContract.write.proveWithdrawalTransaction([
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
    return await portalContract.write.finalizeWithdrawalTransaction([
      withdrawalTransaction
    ]);
  }

  private getChain(chain: string): Chain {
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

  public switchClient(client: 'main' | 'sub') {
    this.client = client === 'main' ? this.getMainClient() : this.getSubClient();
  }

  private getMainClient() {
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

  private getSubClient() {
    const account = privateKeyToAccount(
      this.chain.name === 'localhost' ?
      this.keyManager.getSubPrivateKeyFromKeyStore() :
      this.configure.get('wallet.private_key') as `0x${string}`,
    );
    return createWalletClient({
      chain: this.chain,
      account: account,
      transport: http(),
    });
  }
}
