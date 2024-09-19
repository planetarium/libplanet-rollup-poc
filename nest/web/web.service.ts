import { Injectable } from "@nestjs/common";
import { NCRpcService } from "nest/9c/nc.rpc.service";
import { PublicClientManager } from "nest/evm/public.client";
import { MainWalletManager } from "nest/evm/main.wallet.client";
import { KeyManager } from "nest/key.utils";
import { Address } from "viem";

@Injectable()
export class WebService {
    constructor(
        private readonly publicClientManager: PublicClientManager,
        private readonly ncRpcService: NCRpcService,
        private readonly keyManager: KeyManager,
    ) {}

    async getAddresses() {
        return {
            mainAddress: this.keyManager.getMainAddress(),
            subAddress: this.keyManager.getSubAddress()
        };
    }

    async getBalances() {
        const firstAddress = this.keyManager.getMainAddress();
        const secondAddress = this.keyManager.getSubAddress();

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

    async getBalance(address: Address) {
        var l2Balance = await this.publicClientManager.getBalance(address);
        var l3Balance = await this.ncRpcService.getWethBalance(address);

        var res = {
            l2Balance: l2Balance.toString(),
            l3Balance: l3Balance.toString()
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

    async withdrawETH(from: `main` | `sub`, recipient: Address, amount: bigint) {
        if(from == `main`) {
            return this.ncRpcService.withdrawEth(
                this.keyManager.getMainPrivateKey(),
                recipient,
                amount
            );
        } else {
            return this.ncRpcService.withdrawEth(
                this.keyManager.getSubPrivateKey(),
                recipient, 
                amount
            );
        }
    }
}