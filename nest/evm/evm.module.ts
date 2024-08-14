import { Module } from "@nestjs/common";
import { WalletManager } from "./wallet.client";
import { PublicClientManager } from "./public.client";
import { KeyManager } from "../key.utils";
import { NCModule } from "nest/9c/nc.module";

@Module({
    imports: [NCModule],
    controllers: [],
    providers: [WalletManager, PublicClientManager, KeyManager],
})
export class EvmModule {}