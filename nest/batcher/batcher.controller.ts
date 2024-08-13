import { Controller, Get } from "@nestjs/common";
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
}