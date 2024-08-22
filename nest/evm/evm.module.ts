import { Module } from "@nestjs/common";
import { WalletManager } from "./wallet.client";
import { PublicClientManager } from "./public.client";
import { KeyManager } from "../key.utils";
import { NCModule } from "nest/9c/nc.module";
import { EvmService } from "./evm.service";
import { EvmController } from "./evm.controller";

@Module({
    imports: [NCModule],
    controllers: [EvmController],
    providers: [WalletManager, PublicClientManager, EvmService, KeyManager],
    exports: [WalletManager, PublicClientManager],
})
export class EvmModule {}