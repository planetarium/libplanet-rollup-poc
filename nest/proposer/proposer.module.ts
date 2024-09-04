import { Module } from "@nestjs/common";
import { DeriverModule } from "nest/deriver/deriver.module";
import { ProposerService } from "./proposer.service";
import { NCModule } from "nest/9c/nc.module";
import { EvmModule } from "nest/evm/evm.module";

@Module({
    imports: [
        DeriverModule, 
        NCModule,
        EvmModule,
    ],
    providers: [ProposerService],
    exports: [ProposerService],
})
export class ProposerModule {}