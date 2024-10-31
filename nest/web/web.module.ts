import { Module } from "@nestjs/common";
import { WebService } from "./web.service";
import { WebController } from "./web.controller";
import { EvmModule } from "nest/evm/evm.module";
import { NCModule } from "nest/9c/nc.module";
import { WebGateway } from "./web.gateway";
import { KeyManager } from "nest/key.utils";
import { BatcherModule } from "nest/batcher/batcher.module";
import { DeriverModule } from "nest/deriver/deriver.module";
import { ProposerModule } from "nest/proposer/proposer.module";
import { SessionModule } from "nest/session.module";

@Module({
    imports: [
        EvmModule,
        NCModule,
        BatcherModule,
        DeriverModule,
        ProposerModule,
        SessionModule,
    ],
    controllers: [WebController],
    providers: [WebService, WebGateway, KeyManager],
})
export class WebModule {}