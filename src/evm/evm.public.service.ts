import { Injectable } from "@nestjs/common";
import { EvmClientFactory } from "./evm.client.factory";
import { Address } from "viem";

@Injectable()
export class EvmPublicService {
  constructor(
    private readonly clientFactory: EvmClientFactory,
  ) {}

  private readonly client = this.clientFactory.newPublicClient();

  public async getBalance(address: Address) {
    return await this.client.getBalance({
      address: address,
    });
  }

  public async waitForTransactionReceipt(hash: `0x${string}`) {
    return await this.client.waitForTransactionReceipt({
      hash: hash,
    });
  }

  public async getLatestBlock() {
    const block = await this.client.getBlock();

    return block;
  }

  public async getLatestBlockTimestamp() {
    const block = await this.client.getBlock();

    return block.timestamp;
  }

  public async getBlockByNumber(blockNumber: bigint) {
    return await this.client.getBlock({
      blockNumber: blockNumber,
      includeTransactions: true,
    });
  }

  public async getBlockByHash(blockHash: `0x${string}`) {
    return await this.client.getBlock({
      blockHash: blockHash,
      includeTransactions: true,
    });
  }

  public async findBlockByTimestamp(timestamp: bigint) {
    let startBlock = 0n;
    let endBlock = await this.client.getBlockNumber();
    let currentBlock = await this.getBlockByNumber(startBlock);

    while(startBlock <= endBlock) {
      const midBlock = (startBlock + endBlock) / 2n;
      const midBlockData = (await this.getBlockByNumber(midBlock))
      const midBlockTimestamp = midBlockData.timestamp;

      if (midBlockTimestamp > timestamp) {
        endBlock = midBlock - 1n;
      } else {
        if (midBlockTimestamp > currentBlock.timestamp) {
          currentBlock = midBlockData;
        }
        startBlock = midBlock + 1n;
      }
    }

    return currentBlock;
  }

  public async getTransaction(txHash: `0x${string}`) {
    return await this.client.getTransaction({
      hash: txHash,
    });
  }
}