import { Injectable, Logger } from "@nestjs/common";
import { EvmContractManager } from "./evm.contracts";
import { KeyUtils } from "src/utils/utils.key";
import { EvmClientFactory } from "./evm.client.factory";
import { EvmPublicService } from "./evm.public.service";
import { ChainManager } from "./evm.chains";
import { bytesToRlp, ChainContract, fromHex, isAddress, keccak256, parseAbiItem, parseEventLogs, sha256, stringify, toHex, toRlp } from "viem";
import { getProof, sendTransaction } from "viem/actions";
import { BaseTrie as Trie } from "merkle-patricia-tree";
import { EthProofUtil } from "./utils/utils.eth.proof";
import { TimeUtils } from "src/utils/utils.time";
import { FaultDisputeGameStatus } from "src/challenger/challenger.type";

@Injectable()
export class EvmService {
  constructor(
    private readonly keyUtils: KeyUtils,
    private readonly clientFactory: EvmClientFactory,
    private readonly contractManager: EvmContractManager,
    private readonly publicService: EvmPublicService,
    private readonly chainManager: ChainManager,
  ) {}

  private readonly logger = new Logger(EvmService.name);

  // for testing purpose
  public async test() {
    const privateKey = this.keyUtils.getMainPrivateKey();
    const walletClient = this.clientFactory.getWalletClient(privateKey);
    const preoracleVM = this.contractManager.getPreOracleVM(privateKey);
    const publicClient = this.clientFactory.newPublicClient();
  }

  public async getBalanceByPrivateKey(privateKey: `0x${string}`) {
    const walletClient = this.clientFactory.getWalletClient(privateKey);
    return await this.publicService.getBalance(walletClient.account.address);
  }

  public async getBatchProof(targetTxHash: `0x${string}`) {
    const batchProof = await EthProofUtil.getBatchProof(
      this.chainManager.getChain().rpcUrls.default.http[0],
      targetTxHash,
    )
    return batchProof;
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

  public async getDisputingStartingBlockNumbers(): Promise<bigint[]> {
    const faultDisputeGameFactoryReader = this.contractManager.getFaultDisputeGameFactoryReader();
    const gameCount = await faultDisputeGameFactoryReader.read.gameCount();
    const blockNumbers: bigint[] = [];
    for(let i = 0; i < gameCount; i++) {
      const gameAtIndex = await faultDisputeGameFactoryReader.read.gameAtIndex([BigInt(i)]);
      const proxy = gameAtIndex[1];
      const faultDisputeGameReader = this.contractManager.getFaultDisputeGameReader(proxy);
      const disputeStatus = await faultDisputeGameReader.read.status() as FaultDisputeGameStatus;
      if(disputeStatus === FaultDisputeGameStatus.IN_PROGRESS) {
        const blockNumber = await faultDisputeGameReader.read.startingBlockNumber();
        blockNumbers.push(blockNumber);
      }
    }

    return blockNumbers;
  }
  
  private async sendTransactionsContinuosly() {
    const walletClient = await this.clientFactory.newWalletClient();
    await this.publicService.waitForTransactionReceipt(walletClient.txHash);
    const client = walletClient.client;

    for(let i = 0; i < 10; i++) {
      const randomHex = Math.floor(Math.random() * 256 ** 8).toString(16).padStart(16, '0');
      const data = `0x${randomHex}` as `0x${string}`;

      await client.sendTransaction({
        data: data,
        to: walletClient.client.account.address,
        value: BigInt(Math.floor(Math.random() * 101)),
      });
      await TimeUtils.delay(100);
    }
  }
}