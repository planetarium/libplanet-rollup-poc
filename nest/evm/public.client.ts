import { Injectable, Logger } from '@nestjs/common';
import { Chain, createPublicClient, getContract, http, ChainContract, Address } from 'viem';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as bridgeAbi } from './abi/LibplanetBridge';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as outputOracleAbi } from './abi/LibplanetOutputOracle';
import { NCRpcService } from '../9c/nc.rpc.service';

@Injectable()
export class PublicClientManager {
  constructor(
    private readonly configure: ConfigService,
    // todo: nc_rpc may not be here
    private readonly nc_rpc: NCRpcService,
  ) {
    this.register();
  }

  private readonly logger = new Logger(PublicClientManager.name);

  private readonly chain = this.getChain(this.configure.get('wallet.chain', 'localhost'));
  private readonly client = this.getClient();

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

  public async getLatestOutputRoots() {
    const interval = 100n;
    var toBlockIndex = await this.client.getBlockNumber();
    var fromBlockIndex = toBlockIndex > interval ? toBlockIndex - interval : 0n as bigint;

    while(toBlockIndex > 0n) {
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
      fromBlockIndex = toBlockIndex > interval ? toBlockIndex - interval : 0n;
    }
  }

  public async getLatestOutputRootBlockIndex() {
    const interval = 10n;
    var toBlockIndex = await this.client.getBlockNumber();
    var fromBlockIndex = toBlockIndex > interval ? toBlockIndex - interval : 0n as bigint;

    while(toBlockIndex > 0n) {
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
      fromBlockIndex = toBlockIndex > interval ? toBlockIndex - interval : 0n;
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

  private register() {
    const portalContract = this.getPortalContract();
    const outputOracleContract = this.getOutputOracleContract();

    portalContract.watchEvent.DepositETH({
      onLogs: async (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received DepositETH event: ${log}`);
          this.logger.debug(log.args);
          const fromBalance = await this.client.getBalance({
            address: log.args.from!,
          });
          this.logger.debug(`From balance: ${fromBalance}`);
          var recipient = log.args.to!;
          var amount = log.args.amount!;
          var ok = await this.nc_rpc.mintWeth(recipient, amount);
          if(ok) {
            this.logger.debug(`Minted WETH to ${recipient} with ${amount}`);
          }
        }
      },
    });
    portalContract.watchEvent.WithdrawalProven({}, {
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received WithdrawalProven event: ${log}`);
          this.logger.debug(log.args);
        }
      },
    });
    portalContract.watchEvent.WithdrawalFinalized({}, {
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received WithdrawalFinalized event: ${log}`);
          this.logger.debug(log.args);
        }
      },
    });
    outputOracleContract.watchEvent.OutputProposed({}, {
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received OutputProposed event: ${log}`);
          this.logger.debug(log.args);
          var res = {
            outputRoot: log.args.outputRoot,
            l2OutputIndex: log.args.l2OutputIndex?.toString(),
            l2BlockNumber: log.args.l2BlockNumber?.toString(),
            l1Timestamp: log.args.l1Timestamp?.toString(),
          }
        }
      },
    });
  }

  public watchEvmEvents(event : {
    onDepositETH: (logs: any) => void,
    onWithdrawalProven: (logs: any) => void,
    onWithdrawalFinalized: (logs: any) => void,
    onOutputProposed: (logs: any) => void,
  }) {
    const portalContract = this.getPortalContract();
    const outputOracleContract = this.getOutputOracleContract();

    portalContract.watchEvent.DepositETH({
      onLogs: event.onDepositETH,
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

  private getClient() {
    return createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }
}
