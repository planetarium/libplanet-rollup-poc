import { Injectable, Logger } from '@nestjs/common';
import { Chain, createPublicClient, getContract, http, ChainContract } from 'viem';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as portalAbi } from './abi/LibplanetPortal';
import { abi as txParserAbi } from './abi/TransactionParser';
import { abi as hasParserAbi } from './abi/HackAndSlashParser';
import { abi as txProcessorAbi } from './abi/LibplanetTransactionProcessor';
import { abi as txResultStoreAbi } from './abi/LibplanetTransactionResultsStore';
import { abi as proofVerifierAbi } from './abi/LibplanetProofVerifier';

@Injectable()
export class PublicClientManager {
  constructor(private readonly configure: ConfigService) {
    this.Register();
  }

  private readonly logger = new Logger(PublicClientManager.name);

  private readonly chain = this.GetChain(this.configure.get('wallet.chain', 'localhost'));
  private readonly client = this.GetClient();

  public GetPortalContract() {
    return getContract({
      address: (this.chain.contracts?.libplanetPortal as ChainContract).address,
      abi: portalAbi,
      client: this.client,
    });
  }

  public GetTxParserContract() {
    return getContract({
      address: (this.chain.contracts?.transactionParser as ChainContract).address,
      abi: txParserAbi,
      client: this.client,
    });
  }

  public GetTxProcessorContract() {
    return getContract({
      address: (this.chain.contracts?.libplanetTransactionProcessor as ChainContract).address,
      abi: txProcessorAbi,
      client: this.client,
    });
  }

  public GetHasParserContract() {
    return getContract({
      address: (this.chain.contracts?.hackAndSlashParser as ChainContract).address,
      abi: hasParserAbi,
      client: this.client,
    });
  }

  public GetTxResultStoreContract() {
    return getContract({
      address: (this.chain.contracts?.libplanetTransactionResultsStore as ChainContract).address,
      abi: txResultStoreAbi,
      client: this.client,
    });
  }

  public GetProofVerifierContract() {
    return getContract({
      address: (this.chain.contracts?.libplanetProofVerifier as ChainContract).address,
      abi: proofVerifierAbi,
      client: this.client,
    });
  }

  private Register() {
    const portalContract = this.GetPortalContract();
    const txParserContract = this.GetTxParserContract();
    const txProcessorContract = this.GetTxProcessorContract();
    const hasParserContract = this.GetHasParserContract();
    const txResultStoreContract = this.GetTxResultStoreContract();
    const proofVerifierContract = this.GetProofVerifierContract();

    portalContract.watchEvent.DepositETH({
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received DepositETH event: ${log}`);
        }
      },
    });
    txProcessorContract.watchEvent.TransactionParsed({
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received TransactionParsed event: ${log.args.transaction}`);
        }
      },
    });
    txProcessorContract.watchEvent.TransactionProcessed({},
    {
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received TransactionProcessed event: ${log}`);
          this.logger.debug(log.args);
        }
      },
    });
    txProcessorContract.watchEvent.TransactionParsedIndex({}, {
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received TransactionParsedIndex event: ${log}`);
          this.logger.debug(log.args);
        }
      },
    });
    hasParserContract.watchEvent.HackAndSlashParsed({
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received HackAndSlashParsed event: ${log}`);
          this.logger.debug(log.args.hackAndSlash);
        }
      },
    });
    txResultStoreContract.watchEvent.TxResultStored({}, {
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received TxResultStored event: ${log}`);
          this.logger.debug(log.args);
        }
      }
    });
    proofVerifierContract.watchEvent.ProofVerified({
      onLogs: (logs) => {
        for (const log of logs) {
          this.logger.debug(`Received ProofVerified event: ${log}`);
          this.logger.debug(log.args);
        }
      },
    });
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
    return createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }
}
