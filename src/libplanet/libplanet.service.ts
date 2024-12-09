import { Injectable, Logger } from "@nestjs/common";
import { LibplanetGraphQLService } from "./libplanet.graphql.service";
import { randomBytes } from "crypto";
import { sha256 } from "viem";
import { ConfigService } from "@nestjs/config";
import { TimeUtils } from "src/utils/utils.time";

@Injectable()
export class LibplanetService {
  constructor(
    private readonly graphQlService: LibplanetGraphQLService,
    private readonly configService: ConfigService
  ) {}

  private readonly logger = new Logger(LibplanetService.name);
  private readonly useDebug = this.configService.get('libplanet.debug', false);
  private log(log: any) {
    if(this.useDebug) {
      this.logger.debug(log);
    } else {
      this.logger.log(log);
    }
  }

  // for testing
  public async test() {
    const outputRoot = await this.getOutputRootInfoByBlockIndex(10n);
    return
  }

  public async getWethBalance(address: `0x${string}`) {
    const balance = await this.graphQlService.getWethBalance(address);
    return balance;
  }

  public async getRecentBlock() {
    const block = await this.graphQlService.getRecentBlock();
    return block;
  }

  public async getBlockTimestampByIndex(index: bigint) {
    const timestampString = await this.graphQlService.getBlockTimestampByIndex(index);
    const date = new Date(timestampString);
    const timestamp = Math.floor(date.getTime() / 1000);
    return BigInt(timestamp);
  }

  public async getBlockByIndex(index: bigint, includeTxIds: boolean = false) {
    const block = await this.graphQlService.getBlockByIndex(index, includeTxIds);
    return {
      hash: block.hash,
      index: block.index,
      txHash: block.txHash,
      transactions: block.transactions
    };
  }

  public async getOutputRootInfoByBlockIndex(index: bigint) {
    const outputRoot = await this.graphQlService.getOutputProposal(index);
    return {
      root: outputRoot.outputRoot,
      l2BlockNumber: outputRoot.blockIndex
    }
  }

  public async getOutputRootByTransactionId(txId: string) {
    const stateRootHashRes = await this.graphQlService.getTransactionResult(txId);
    const storageRootHashRes = await this.graphQlService.getStorageRootHash(stateRootHashRes);

    var stateRootHash = Uint8Array.from(Buffer.from(stateRootHashRes, 'hex'));
    var storageRootHash = Uint8Array.from(Buffer.from(storageRootHashRes, 'hex'));
    
    var outputRootArray = new Uint8Array(64);
    outputRootArray.set(stateRootHash, 0);
    outputRootArray.set(storageRootHash, 32);  

    var outputRoot = sha256(outputRootArray);

    return outputRoot;
  }

  public async sendBulkTransactions() {
    for(var i = 0; i < 10; i++) {
      await TimeUtils.delay(1000);
      const res = await this.graphQlService.sendSimpleTransaction(randomBytes(16564).toString('hex'));
      this.log(`Sent transaction ${i} with result ${res.slice(0, 3)}`);
    }
  }

  public async mintWeth(
    receipient: `0x${string}`,
    amount: bigint
  ) {
    return await this.graphQlService.mintWeth(receipient, amount);
  }
}