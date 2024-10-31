import { Injectable } from "@nestjs/common";
import { ChainManager } from "./evm.chains";
import { Address, createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ethers } from "ethers";
import { KeyUtils } from "src/utils/utils.key";
import { MutexService } from "src/mutex/mutex.service";
import { EvmPublicService } from "./evm.public.service";

@Injectable()
export class EvmClientFactory{
  constructor(
    private readonly chainMangager: ChainManager,
    private readonly keyUtils: KeyUtils,
    private readonly mutexService: MutexService,
  ) {}

  public newPublicClient() {
    const chain = this.chainMangager.getChain();
    return createPublicClient({
      chain: chain,
      transport: http(),
    });
  }

  public async newWalletClient() {
    return await this.mutexService.runLocked(async () => {
      const chain = this.chainMangager.getChain();
      const privateKey = this.newPrivateKey();
      const account = privateKeyToAccount(privateKey);
      const client = createWalletClient({
        chain: chain,
        account: account,
        transport: http(),
      });
      const txHash = await this.sendDefaultFee(account.address);
      return {
        client: client,
        privateKey: privateKey,
        txHash: txHash,
      }
    });
  }

  public getWalletClient(privateKey: `0x${string}`) {
    const chain = this.chainMangager.getChain();
    const account = privateKeyToAccount(privateKey);
    return createWalletClient({
      chain: chain,
      account: account,
      transport: http(),
    });
  }

  private newPrivateKey() {
    const chain = this.chainMangager.getChain();
    const rpcProvider = chain.rpcUrls.default.http[0];
    const provider = new ethers.JsonRpcProvider(rpcProvider);
    const wallet = ethers.Wallet.createRandom(provider);

    return wallet.privateKey as `0x${string}`;
  }

  private async sendDefaultFee(address: Address) {
    const DEFAULT_FEE = 1000000000000n;

    const mainPrivateKey = this.keyUtils.getMainPrivateKey();
    const mainWallet = this.getWalletClient(mainPrivateKey);
    return await mainWallet.sendTransaction({
      to: address,
      value: DEFAULT_FEE,
    });
  }
}