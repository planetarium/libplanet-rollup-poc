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

    async getBalancesForWeb() {
        const firstAddress = '0xCE70F2e49927D431234BFc8D439412eef3a6276b';
        const secondAddress = '0x47E0Dd0B503C153D7FB78c43cc9aC135C60Dfd94';

        var l1FistAddressBalance = await this.publicClient.getBalance(firstAddress);
        var l1SecondAddressBalance = await this.publicClient.getBalance(secondAddress);

        var l2FirstAddressBalance = await this.ncRpc.getWethBalanceFromLocal(firstAddress);
        var l2SecondAddressBalance = await this.ncRpc.getWethBalanceFromLocal(secondAddress);

        var res = {
            l1FistAddressBalance: l1FistAddressBalance.toString(),
            l1SecondAddressBalance: l1SecondAddressBalance.toString(),
            l2FirstAddressBalance: l2FirstAddressBalance.toString(),
            l2SecondAddressBalance: l2SecondAddressBalance.toString()
        };

        return res;
    }

    async getLatestOutputRoots() {
        var res = await this.publicClient.getLatestOutputRoots();
        if(res == undefined) {
        return { message: 'No output roots found' };
        }
        var outputRootInfo = {
            outputRoot: res.outputRoot,
            l2OutputIndex: res.l2OutputIndex?.toString(),
            l2BlockNumber: res.l2BlockNumber?.toString(),
            l1Timestamp: res.l1Timestamp?.toString(),
        }
        return outputRootInfo;
    }
}