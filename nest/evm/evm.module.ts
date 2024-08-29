import { Module } from "@nestjs/common";
import { WalletManager } from "./wallet.client";
import { PublicClientManager } from "./public.client";
import { KeyManager } from "../key.utils";
import { NCModule } from "nest/9c/nc.module";
import { EvmService } from "./evm.service";
import { EvmController } from "./evm.controller";
import { OutputRootProposeManager } from "./propose.client";

@Module({
    imports: [NCModule],
    controllers: [EvmController],
    providers: [WalletManager, PublicClientManager, OutputRootProposeManager, EvmService, KeyManager],
    exports: [WalletManager, PublicClientManager, OutputRootProposeManager],
})
export class EvmModule {}