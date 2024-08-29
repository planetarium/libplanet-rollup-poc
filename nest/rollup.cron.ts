import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WalletManager } from './evm/wallet.client';
import { NCRpcService } from './9c/nc.rpc.service';
import { OutputRootProposeManager } from './evm/propose.client';

@Injectable()
export class RollupCronService {
  constructor(
    private readonly wallet: WalletManager,
    private readonly outputRootProposeManager: OutputRootProposeManager,
    private readonly nc_rpc: NCRpcService,
  ) {}

  private readonly logger = new Logger(RollupCronService.name);

  @Cron(CronExpression.EVERY_10_SECONDS)
  async proposeOutputRootCron() {
    this.logger.debug('Running get cron...');
    const result = await this.nc_rpc.getOutputRootProposalFromLocalNetwork();
    this.logger.debug(`Got OutputRootProposal from Libplanet`);
    await this.outputRootProposeManager.propose(result);
  }
}
