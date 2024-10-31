import { Module } from "@nestjs/common";
import { NCModule } from "nest/9c/nc.module";
import { ChannelManager } from "./batcher.channel.manger";
import { BatcherService } from "./batcher.service";
import { EvmModule } from "nest/evm/evm.module";

@Module({
    imports: [NCModule, EvmModule],
    providers: [BatcherService, ChannelManager],
    exports: [BatcherService]
})
export class BatcherModule {}