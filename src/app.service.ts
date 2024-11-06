import { Injectable } from '@nestjs/common';
import { BatcherService } from './batcher/batcher.service';
import { DeriverService } from './deriver/deriver.service';
import { PreoracleService } from './preoracle/preoracle.service';
import { ProposerService } from './proposer/proposer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly batcherService: BatcherService,
    private readonly deriverService: DeriverService,
    private readonly proposerService: ProposerService,
    private readonly preoracleService: PreoracleService,
  ) {
    this.init();
  }

  private async init() {
    if(this.configService.get('challenger.enabled')){
      await this.preoracleService.init();
    }

    //this.batcherService.batchStart();
    this.deriverService.deriveStart();
    this.proposerService.proposeStart();
  }
}
