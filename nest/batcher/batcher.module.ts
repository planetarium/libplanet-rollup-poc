import { Module } from "@nestjs/common";
import { NCModule } from "nest/9c/nc.module";
import { ChannelManager } from "./batcher.channel.manger";
import { BatcherService } from "./batcher.service";
import { BatcherController } from "./batcher.controller";

@Module({
    imports: [NCModule],
    controllers: [BatcherController],
    providers: [BatcherService, ChannelManager],
})
export class BatcherModule {}