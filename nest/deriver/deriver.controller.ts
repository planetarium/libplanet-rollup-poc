import { Controller, Get, Query } from "@nestjs/common";
import { DeriverService } from "./deriver.service";

@Controller('deriver')
export class DeriverController {
    constructor(
        private readonly deriverService: DeriverService
    ) {}

    @Get('derivate')
    async derivate(@Query('start') start: bigint) {
        return await this.deriverService.derivate(start);
    }
}