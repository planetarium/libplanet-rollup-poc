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
import { WalletClientManager } from "./wallet.client";

@Module({
    imports: [NCModule],
    controllers: [EvmController],
    providers: [MainWalletManager, PublicClientManager, WalletClientManager, ProposerClientManager, EvmService, KeyManager, ChainManager, BatcherClientManager],
    exports: [MainWalletManager, PublicClientManager, WalletClientManager, ProposerClientManager, EvmService, BatcherClientManager],
})
export class EvmModule {}