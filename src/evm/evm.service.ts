import { Injectable } from "@nestjs/common";
import { EvmContractManager } from "./evm.contracts";
import { KeyUtils } from "src/utils/utils.key";
import { EvmClientFactory } from "./evm.client.factory";
import { EvmPublicService } from "./evm.public.service";
import { ChainManager } from "./evm.chains";
import { bytesToRlp, ChainContract, fromHex, isAddress, keccak256, sha256, toHex, toRlp } from "viem";
import { getProof, sendTransaction } from "viem/actions";
import { BaseTrie as Trie } from "merkle-patricia-tree";
import { EthProofUtil } from "./utils/utils.eth.proof";

@Injectable()
export class EvmService {
  constructor(
    private readonly keyUtils: KeyUtils,
    private readonly clientFactory: EvmClientFactory,
    private readonly contractManager: EvmContractManager,
    private readonly publicService: EvmPublicService,
    private readonly chainManager: ChainManager,
  ) {}

  // for testing purpose
  public async init() {
    this.sendTransactionsContinuosly();
    await this.delay(10000);
    const latestBlock = await this.publicService.getLatestBlock();
    if(latestBlock.transactions.length > 0) {
      const targetTxHash = latestBlock.transactions[0];
      const batchProof = await this.getBatchProof(targetTxHash);
      return;
    }
    return;
  }

  public async getBatchProof(targetTxHash: `0x${string}`) {
    const batchProof = await EthProofUtil.getBatchProof(
      this.chainManager.getChain().rpcUrls.default.http[0],
      targetTxHash,
    )
    return batchProof;
  }

  private async sendTransactionsContinuosly() {
    const walletClient = await this.clientFactory.newWalletClient();
    await this.publicService.waitForTransactionReceipt(walletClient.txHash);
    const client = walletClient.client;

    while(true) {
      const randomHex = Math.floor(Math.random() * 256 ** 8).toString(16).padStart(16, '0');
      const data = `0x${randomHex}` as `0x${string}`;

      await client.sendTransaction({
        data: data,
        to: walletClient.client.account.address,
        value: BigInt(Math.floor(Math.random() * 101)),
      });
      await this.delay(100);
    }
  }

  public async getAnchor() {
    const anchorStateRegistryReader = this.contractManager.getAnchorStateRegistryReader();
    return await anchorStateRegistryReader.read.getAnchor();
  }

  public getAnchorContractDeployedBlockNumber() {
    const anchorContract = this.chainManager.getChain().contracts?.anchorStateRegistry as ChainContract;
    return anchorContract.blockCreated ?? 0;
  }

  public getBatcherWallet() {
    const batcherPrivateKey = this.keyUtils.getBatcherPrivateKey();
    return this.clientFactory.getWalletClient(batcherPrivateKey);
  }

  public getBlockByNumber(blockNumber: bigint) {
    return this.publicService.getBlockByNumber(blockNumber);
  }

  public async findBlockIndexByTimestamp(timestamp: bigint) {
    const block = await this.publicService.findBlockByTimestamp(timestamp);
    return block.number;
  }
  
  private async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
}