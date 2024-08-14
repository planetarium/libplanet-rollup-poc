import { Controller, Get, Query } from "@nestjs/common";
import { BatcherService } from "./batcher.service";

@Controller('batcher')
export class BatcherController {
    constructor(
        private readonly batcherService: BatcherService
    ) {}

    @Get('start')
    async start() {
        return this.batcherService.start();
    }

    @Get('process')
    async processAll(@Query('stop') stop: bigint) {
        return this.batcherService.loopUntilProcessAllBlocks(stop);
    }
}