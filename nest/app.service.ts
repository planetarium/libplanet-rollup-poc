import { Injectable } from "@nestjs/common";
import { WalletManager } from "./evm/wallet.client";
import { NCRpcService } from "./9c/nc.rpc.service";
import { PublicClientManager } from "./evm/public.client";

@Injectable()
export class AppService {
    constructor(
        private readonly wallet: WalletManager,
        private readonly publicClient: PublicClientManager,
        private readonly ncRpc: NCRpcService
    ) {}
}