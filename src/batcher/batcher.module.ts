import { Module } from "@nestjs/common";
import { ChannelManager } from "./batcher.channel.manger";
import { BatcherService } from "./batcher.service";
import { LibplanetModule } from "src/libplanet/libplanet.module";
import { EvmModule } from "src/evm/evm.module";
import { KeyUtils } from "src/utils/utils.key";

@Module({
    imports: [LibplanetModule, EvmModule],
    providers: [BatcherService, ChannelManager, KeyUtils],
    exports: [BatcherService]
})
export class BatcherModule {}