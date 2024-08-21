import { Module } from "@nestjs/common";
import { EvmModule } from "nest/evm/evm.module";

@Module({
    imports: [EvmModule],
    controllers: [],
    providers: [],
})
export class DeriverModule {}