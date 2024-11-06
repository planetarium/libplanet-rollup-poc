import { Injectable } from '@nestjs/common';
import { BatcherService } from './batcher/batcher.service';
import { DeriverService } from './deriver/deriver.service';
import { PreoracleService } from './preoracle/preoracle.service';

@Injectable()
export class AppService {
  constructor(
    private readonly batcherService: BatcherService,
    private readonly deriverService: DeriverService,
    private readonly preoracleService: PreoracleService,
  ) {
    this.init();
  }

  private async init() {
    await this.preoracleService.init();

    //this.batcherService.batchStart();
    //this.deriverService.deriveStart();
  }
}
