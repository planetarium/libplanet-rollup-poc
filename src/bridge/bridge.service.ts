import { Injectable } from "@nestjs/common";
import { LibplanetBridgeAbi } from "src/evm/abis/LibplanetBridge.abi";
import { LibplanetPortalAbi } from "src/evm/abis/LibplanetPortal.abi";
import { EvmClientFactory } from "src/evm/evm.client.factory";
import { EvmContractManager } from "src/evm/evm.contracts";
import { EvmPublicService } from "src/evm/evm.public.service";
import { LibplanetService } from "src/libplanet/libplanet.service";
import { parseAbiItem, parseEventLogs } from "viem";

@Injectable()
export class BridgeService {
  constructor(
    private readonly evmClientFactory: EvmClientFactory,
    private readonly evmContractManager: EvmContractManager,
    private readonly evmPublicService: EvmPublicService,
    private readonly libplanetService: LibplanetService,
  ) {}

  public async getBalance(privateKey: `0x${string}`) {
    const address = this.evmClientFactory.getWalletClient(privateKey).account.address;
    const l2Eth = await this.evmPublicService.getBalance(address);
    const l3Weth = await this.libplanetService.getWethBalance(address);

    return {
      l2Eth: l2Eth.toString(),
      l3Weth: l3Weth.toString(),
    }
  }

  public async depositEth(
    privateKey: `0x${string}`,
    receipient: `0x${string}`,
    amount: bigint,
  ) {
    const walletClient = this.evmClientFactory.getWalletClient(privateKey);
    const libplanetBridge = this.evmContractManager.getLibplanetBridge(privateKey);
    const txHash = await libplanetBridge.write.depositETH([
      walletClient.account.address,
      receipient,
      amount
    ], {
      value: amount,
    });
    const receipt = await this.evmPublicService.waitForTransactionReceipt(txHash);
    const event = parseEventLogs({
        abi: LibplanetPortalAbi,
        eventName: 'EthDeposited',
        logs: receipt.logs
    })[0].args;

    const isMinted = await this.libplanetService.mintWeth(event.to, event.amount);

    if(!isMinted) {
      throw new Error('WETH mint failed');
    }

    return "success";
  }
}