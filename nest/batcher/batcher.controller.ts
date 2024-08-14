import { Controller, Get, Query } from "@nestjs/common";
import { BatcherService } from "./batcher.service";
import { stringify } from "viem";

@Controller('batcher')
export class BatcherController {
    constructor(
        private readonly batcherService: BatcherService
    ) {}

    @Get('start')
    async start() {
        return await this.batcherService.start();
    }

    @Get('process')
    async processAll(@Query('stop') stop: bigint) {
        return await this.batcherService.loopUntilProcessAllBlocks(stop);
    }

    @Get('transactions')
    async getTransactions() {
        var results = await this.batcherService.getBatchTransactions();
        return stringify(results);
    }
}