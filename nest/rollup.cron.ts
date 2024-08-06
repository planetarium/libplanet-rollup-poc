import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WalletManager } from './wallet.client';
import { NCRpcService } from './9c/nc.rpc.service';
import { BencodexDictionary, encode } from '@planetarium/bencodex';
import { fromBytes } from 'viem';
import { serialize } from 'v8';

@Injectable()
export class RollupCronService {
  constructor(
    private readonly wallet: WalletManager,
    private readonly nc_rpc: NCRpcService,
  ) {}

  private readonly logger = new Logger(RollupCronService.name);

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // async runCron() {
  //   this.logger.debug('Running cron...');
  //   const blocks = await this.nc_rpc.getBlocks();
  //   this.logger.debug(`Got ${blocks.length} blocks`);
  //   const value: BencodexDictionary[] = [];
  //   for (const block of blocks) {
  //     value.push(
  //       new BencodexDictionary([
  //         ['index', BigInt(block.index)],
  //         ['hash', block.hash],
  //         ['miner', block.miner],
  //       ]),
  //     );
  //   }
  //   const serialized = encode(value);
  //   const txId = await this.wallet.sendTransaction(
  //     fromBytes(serialized, 'hex'),
  //   );
  //   this.logger.debug(`Sent transaction ${txId}`);
  // }

  // @Cron("*/3 * * * * *")
  // async sendSimpleTxCron() {
  //   this.logger.debug('Running send cron...');
  //   const result = await this.nc_rpc.sendSimpleTransactionToLocalNetwork((Math.random() * 100).toString());
  //   this.logger.debug(`Sent string: ${result}`);
  // }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  // async verifyTxProofsCron() {
  //   this.logger.debug('Running get cron...');
  //   const result = await this.nc_rpc.getTxWorldProofsFromLocalNetwork(3);
  //   this.logger.debug(`Got ${result.length} transaction results`);
  //   for (const proof of result) {
  //     await this.wallet.verifyTxProof(proof);
  //   }
  // }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async proposeOutputRootCron() {
    this.logger.debug('Running get cron...');
    const result = await this.nc_rpc.getOutputRootProposalFromLocalNetwork();
    this.logger.debug(`Got OutputRootProposal from Libplanet`);
    await this.wallet.proposeOutputRoot(result);
  }

  // @Cron(CronExpression.EVERY_10_SECONDS)
  // async testTxDesrializerCron() {
  //   this.logger.debug('Running cron...');
  //   const result = await this.nc_rpc.getTransactions();
  //   this.logger.debug(`Got ${result.transactions.length} transactions`);
  //   const serializedPayloads = result.transactions.map((tx) => {
  //     var sp = Buffer.from(tx.serializedPayload, 'utf-8').toString('hex');
  //     return `0x${sp}` as `0x${string}`;
  //   });
  //   const blockIndex = BigInt(result.index);
  //   const txId = this.wallet.parseTxs(blockIndex, serializedPayloads);
  //   this.logger.debug(`Sent transaction ${txId}`);
  // }
}
