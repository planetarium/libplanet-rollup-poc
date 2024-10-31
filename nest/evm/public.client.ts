import { Injectable, Logger } from '@nestjs/common';
import { Chain, createPublicClient, getContract, http, ChainContract, Address } from 'viem';
import { ChainManager } from './evm.chains';
import { ConfigService } from '@nestjs/config';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as outputOracleAbi } from './abi/LibplanetOutputOracle';

@Injectable()
export class PublicClientManager {
  constructor(
    private readonly configure: ConfigService,
    private readonly chainManger: ChainManager,
  ) {}

  private readonly logger = new Logger(PublicClientManager.name);

  private readonly chain = this.chainManger.getChain();
  private readonly client = this.getClient();

  public async getSafeBlock() {
    return await this.client.getBlock({
      blockTag: 'safe',
    });
  }

  public async getBlock(blockNumber: bigint) {
    return await this.client.getBlock({
      blockNumber: blockNumber,
      includeTransactions: true,
    });
  }

  public async getBalance(address: Address) {
    return await this.client.getBalance({ address });
  }

  public async getTransaction(txHash: `0x${string}`) {
    return await this.client.getTransaction({
      hash: txHash,
    });
  }

  public async waitForTransactionReceipt(txHash: `0x${string}`) {
    return await this.client.waitForTransactionReceipt({
      hash: txHash,
    });
  }

  public async getLatestOutputRoots() {
    const interval = 1000n;
    const minimalBlockIndex = BigInt((this.chain.contracts?.libplanetOutputOracle as ChainContract).blockCreated || 0); 

    var toBlockIndex = await this.client.getBlockNumber();
    var fromBlockIndex = toBlockIndex > interval ? toBlockIndex - interval : 0n as bigint;

    while(toBlockIndex > minimalBlockIndex) {
      const logs = await this.client.getContractEvents({
        address: (this.chain.contracts?.libplanetOutputOracle as ChainContract).address,
        abi: outputOracleAbi,
        eventName: 'OutputProposed',
        fromBlock: fromBlockIndex as bigint,
        toBlock: toBlockIndex as bigint,
      });

      if(logs.length > 0) {
        return logs[logs.length - 1].args;
      }

      toBlockIndex = fromBlockIndex;
      fromBlockIndex = toBlockIndex - minimalBlockIndex > interval ? toBlockIndex - interval : minimalBlockIndex;
    }
  }

  public async getLatestOutputRootBlockIndex() {
    const interval = 100n;
    const minimalBlockIndex = BigInt((this.chain.contracts?.libplanetOutputOracle as ChainContract).blockCreated || 0); 

    var toBlockIndex = await this.client.getBlockNumber();
    var fromBlockIndex = toBlockIndex > interval ? toBlockIndex - interval : 0n as bigint;

    while(toBlockIndex > minimalBlockIndex) {
      const logs = await this.client.getContractEvents({
        address: (this.chain.contracts?.libplanetOutputOracle as ChainContract).address,
        abi: outputOracleAbi,
        eventName: 'OutputProposed',
        fromBlock: fromBlockIndex as bigint,
        toBlock: toBlockIndex as bigint,
      });

      if(logs.length > 0) {
        return fromBlockIndex;
      }

      toBlockIndex = fromBlockIndex;
      fromBlockIndex = toBlockIndex - minimalBlockIndex > interval ? toBlockIndex - interval : minimalBlockIndex;
    }
  }

  public async checkContractsDeployed(): Promise<boolean> {
    const bridgeContract = this.getBridgeContract();
    if (!bridgeContract) {
      return false;
    }

    const portalContract = this.getPortalContract();
    if (!portalContract) {
      return false;
    }
    const outputOracleContract = this.getOutputOracleContract();
    if (!outputOracleContract) {
      return false;
    }

    return true;
  }

  public getBridgeContract() {
    return getContract({
      address: (this.chain.contracts?.libplanetBridge as ChainContract).address,
      abi: bridgeAbi,
      client: this.client,
    });
  }

  public getPortalContract() {
    return getContract({
      address: (this.chain.contracts?.libplanetPortal as ChainContract).address,
      abi: portalAbi,
      client: this.client,
    });
  }

  public getOutputOracleContract() {
    return getContract({
      address: (this.chain.contracts?.libplanetOutputOracle as ChainContract).address,
      abi: outputOracleAbi,
      client: this.client,
    });
  }
  
  public watchEvmEvents(event : {
    onEthDeposited: (logs: any) => void,
    onWithdrawalProven: (logs: any) => void,
    onWithdrawalFinalized: (logs: any) => void,
    onOutputProposed: (logs: any) => void,
  }) {
    const portalContract = this.getPortalContract();
    const outputOracleContract = this.getOutputOracleContract();

    portalContract.watchEvent.EthDeposited({}, {
      onLogs: event.onEthDeposited,
    });
    portalContract.watchEvent.WithdrawalProven({}, {
      onLogs: event.onWithdrawalProven,
    });
    portalContract.watchEvent.WithdrawalFinalized({}, {
      onLogs: event.onWithdrawalFinalized,
    });
    outputOracleContract.watchEvent.OutputProposed({}, {
      onLogs: event.onOutputProposed,
    });
  }

  private getClient() {
    return createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }
}
