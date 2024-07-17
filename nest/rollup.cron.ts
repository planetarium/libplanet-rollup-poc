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

  @Cron(CronExpression.EVERY_10_SECONDS)
  async testTxDesrializerCron() {
    this.logger.debug('Running cron...');
    const transactions = await this.nc_rpc.getTransactions();
    this.logger.debug(`Got ${transactions.length} transactions`);
    const serializedPayloads = transactions.map((tx) => {
      var sp = Buffer.from(tx.serializedPayload, 'utf-8').toString('hex');
      return `0x${sp}` as `0x${string}`;
    });
    const txId = this.wallet.parseTxs(0n, serializedPayloads);
    this.logger.debug(`Sent transaction ${txId}`);
  }
}
