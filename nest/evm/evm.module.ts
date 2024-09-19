import { Module } from "@nestjs/common";
import { MainWalletManager } from "./main.wallet.client";
import { PublicClientManager } from "./public.client";
import { KeyManager } from "../key.utils";
import { NCModule } from "nest/9c/nc.module";
import { EvmService } from "./evm.service";
import { EvmController } from "./evm.controller";
import { ProposerClientManager } from "./proposer.client";
import { ChainManager } from "./evm.chains";
import { BatcherClientManager } from "./batcher.client";

@Module({
    imports: [NCModule],
    controllers: [EvmController],
    providers: [MainWalletManager, PublicClientManager, ProposerClientManager, EvmService, KeyManager, ChainManager, BatcherClientManager],
    exports: [MainWalletManager, PublicClientManager, ProposerClientManager, EvmService, BatcherClientManager],
})
export class EvmModule {}