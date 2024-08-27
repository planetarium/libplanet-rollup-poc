import { Module } from "@nestjs/common";
import { EvmModule } from "nest/evm/evm.module";
import { DeriverController } from "./deriver.controller";
import { DeriverService } from "./deriver.service";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { DataSource } from "./deriver.data.source";
import { FrameQueue } from "./deriver.frame.queue";
import { ChannelBank } from "./deriver.channel.bank";
import { ChannelInReader } from "./deriver.channel.in.reader";

@Module({
    imports: [EvmModule],
    controllers: [DeriverController],
    providers: [
        DeriverService,
        L1Retrieval,
        DataSource,
        FrameQueue,
        ChannelBank,
        ChannelInReader,
    ],
})
export class DeriverModule {}