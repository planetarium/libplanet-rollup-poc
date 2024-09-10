import { Controller, Get, Render } from "@nestjs/common";
import { WebService } from "./web.service";

@Controller('web')
export class WebController {
    constructor(
        private readonly webService: WebService,
    ) {}

    @Get()
    @Render('index')
    async view() {
        var outputRootInfo = await this.webService.getLatestOutputRoots();
        var addresses = await this.webService.getAddresses();
        var addressBalances = await this.webService.getBalances();
        return {
            outputRootInfo: outputRootInfo,
            addresses: addresses,
            addressBalances: addressBalances,
        }
    }
}