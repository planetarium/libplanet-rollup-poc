import { Body, Controller, Get, Post, Render, Res, Session } from "@nestjs/common";
import { WebService } from "./web.service";
import { KeyManager } from "nest/key.utils";
import { privateKeyToAddress } from "viem/accounts";

@Controller('web')
export class WebController {
    constructor(
        private readonly webService: WebService,
        private readonly keyManager: KeyManager,
    ) {}

    @Get()
    @Render('index')
    async view(@Session() session: Record<string, any>) {
        var outputRootInfo = await this.webService.getLatestOutputRoots();

        if(session.private_key) {
            var address = privateKeyToAddress(session.private_key);
            var balances = await this.webService.getBalance(address);
            return {
                outputRootInfo: outputRootInfo,
                address: address,
                balances: balances,
            }
        } else {
            return {
                outputRootInfo: outputRootInfo,
            }
        }
    }

    @Post('set/address')
    async setAddress(
        @Res() res: any,
        @Body() body: { private_key: string }, 
        @Session() session: Record<string, any>
    ) {
        session.private_key = body.private_key;
        return res.redirect('/web');
    }
}