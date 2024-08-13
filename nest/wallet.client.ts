import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract, Address, sha256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { abi as outputOracleAbi } from './abi/LibplanetOutputOracle';
import { KeyManager } from './key.utils';
import { OutputRootProposal, WithdrawalTransaction } from './9c/nc.respose.types';

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

  async batchTransaction(payload: `0x${string}`): Promise<`0x${string}`> {
    return this.client.sendTransaction({
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
