import { Module } from "@nestjs/common";
import { ProposerService } from "./proposer.service";
import { DeriverModule } from "src/deriver/deriver.module";
import { LibplanetModule } from "src/libplanet/libplanet.module";
import { EvmModule } from "src/evm/evm.module";

@Module({
    imports: [
        DeriverModule, 
        LibplanetModule,
        EvmModule,
    ],
    providers: [ProposerService],
    exports: [ProposerService],
})
export class ProposerModule {}