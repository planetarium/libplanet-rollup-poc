import { Injectable } from "@nestjs/common";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { PublicClientManager } from "nest/evm/public.client";
import { WalletManager } from "nest/evm/wallet.client";

@Injectable()
export class WebService {
    constructor(
        private readonly publicClientManager: PublicClientManager,
        private readonly ncRpcService: NCRpcService,
    ) {}

    async getBalances() {
        const firstAddress = '0xCE70F2e49927D431234BFc8D439412eef3a6276b';
        const secondAddress = '0xaA2337b6FC4EDcc99FBDc9dee5973c94849dCEce';

        var l1FistAddressBalance = await this.publicClientManager.getBalance(firstAddress);
        var l1SecondAddressBalance = await this.publicClientManager.getBalance(secondAddress);

        var l2FirstAddressBalance = await this.ncRpcService.getWethBalance(firstAddress);
        var l2SecondAddressBalance = await this.ncRpcService.getWethBalance(secondAddress);

        var res = {
            l1FirstAddressBalance: l1FistAddressBalance.toString(),
            l1SecondAddressBalance: l1SecondAddressBalance.toString(),
            l2FirstAddressBalance: l2FirstAddressBalance.toString(),
            l2SecondAddressBalance: l2SecondAddressBalance.toString()
        };

        return res;
    }

    async getLatestOutputRoots() {
        var res = await this.publicClientManager.getLatestOutputRoots();
        if(res == undefined) {
            return null;
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