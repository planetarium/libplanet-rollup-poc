import { Controller, Get } from "@nestjs/common";
import { DeriverService } from "./deriver.service";

@Controller('deriver')
export class DeriverController {
    constructor(
        private readonly deriverService: DeriverService
    ) {}

    @Get('test')
    async test() {
        return await this.deriverService.test();
    }
}