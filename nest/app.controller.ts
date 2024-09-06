import { Controller, Get, Render } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
    ) {}

    @Get('initialize/check')
    async checkInitialization() {
        return await this.appService.checkInitialized();
    }

    @Get('initialize')
    async initialize() {
        return await this.appService.initialize();
    }

    @Get('rollup/start')
    async startRollup() {
        return await this.appService.startRollup();
    }

    @Get('rollup/stop')
    async stopRollup() {
        return await this.appService.stopRollup();
    }
}