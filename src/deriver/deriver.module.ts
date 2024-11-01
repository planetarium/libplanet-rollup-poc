import { Module } from "@nestjs/common";
import { DeriverService } from "./deriver.service";
import { L1Retrieval } from "./dertiver.l1.retrieval";
import { DataSource } from "./deriver.data.source";
import { FrameQueue } from "./deriver.frame.queue";
import { ChannelBank } from "./deriver.channel.bank";
import { ChannelInReader } from "./deriver.channel.in.reader";
import { BatchQueue } from "./deriver.batch.queue";
import { KeyUtils } from "src/utils/utils.key";
import { EvmModule } from "src/evm/evm.module";
import { LibplanetModule } from "src/libplanet/libplanet.module";

@Module({
    imports: [LibplanetModule, EvmModule],
    providers: [
        DeriverService,
        L1Retrieval,
        DataSource,
        FrameQueue,
        ChannelBank,
        ChannelInReader,
        BatchQueue,
        KeyUtils,
    ],
    exports: [L1Retrieval, ChannelInReader, DeriverService],
})
export class DeriverModule {}