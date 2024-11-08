import { Injectable } from '@nestjs/common';
import { BatcherService } from './batcher/batcher.service';
import { DeriverService } from './deriver/deriver.service';
import { PreoracleService } from './preoracle/preoracle.service';
import { ProposerService } from './proposer/proposer.service';
import { ConfigService } from '@nestjs/config';
import { EvmService } from './evm/evm.service';
import { ChallengerService } from './challenger/challenger.service';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly evmService: EvmService,
    private readonly batcherService: BatcherService,
    private readonly deriverService: DeriverService,
    private readonly proposerService: ProposerService,
    private readonly challengerService: ChallengerService,
    private readonly preoracleService: PreoracleService,
  ) {
    this.init();
  }

  private async init() {
    // // for testing purpose
    // await this.evmService.init();

    if(this.configService.get('challenger.enabled')){
      await this.preoracleService.init();
    }

    // this.batcherService.batchStart();
    // this.deriverService.deriveStart();
    // this.proposerService.proposeStart();

    // this.challengerService.init();
  }
}
