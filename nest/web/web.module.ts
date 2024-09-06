import { Module } from "@nestjs/common";
import { WebService } from "./web.service";
import { WebController } from "./web.controller";
import { EvmModule } from "nest/evm/evm.module";
import { NCModule } from "nest/9c/nc.module";
import { WebGateway } from "./web.gateway";

@Module({
    imports: [
        EvmModule,
        NCModule,
    ],
    controllers: [WebController],
    providers: [WebService, WebGateway],
})
export class WebModule {}