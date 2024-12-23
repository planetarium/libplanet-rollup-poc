import { Module } from "@nestjs/common";
import { EvmModule } from "nest/evm/evm.module";
import { DeriverService } from "./deriver.service";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { DataSource } from "./deriver.data.source";
import { FrameQueue } from "./deriver.frame.queue";
import { ChannelBank } from "./deriver.channel.bank";
import { ChannelInReader } from "./deriver.channel.in.reader";
import { BatchQueue } from "./deriver.batch.queue";
import { KeyManager } from "nest/key.utils";

@Module({
    imports: [EvmModule],
    providers: [
        DeriverService,
        L1Retrieval,
        DataSource,
        FrameQueue,
        ChannelBank,
        ChannelInReader,
        BatchQueue,
        KeyManager,
    ],
    exports: [L1Retrieval, ChannelInReader, DeriverService],
})
export class DeriverModule {}