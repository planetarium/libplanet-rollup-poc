import { Injectable, Logger } from "@nestjs/common";
import { LibplanetGraphQLService } from "./libplanet.graphql.service";
import { randomBytes } from "crypto";
import { Batch, Block } from "src/batcher/batcher.types";

@Injectable()
export class LibplanetService {
  constructor(
    private readonly graphQlService: LibplanetGraphQLService,
  ) {
    //this.init();
  }

  private readonly logger = new Logger(LibplanetService.name); 

  private async init() {
    return
  }

  public async getBlockTimestampByIndex(index: bigint) {
    const timestampString = await this.graphQlService.getBlockTimestampByIndex(index);
    const date = new Date(timestampString);
    const timestamp = Math.floor(date.getTime() / 1000);
    return BigInt(timestamp);
  }

  public async getBlockByIndex(index: bigint) {
    const block = await this.graphQlService.getBlockByIndex(index);
    return {
      hash: block.hash,
      index: block.index,
      txHash: block.txHash,
      transactions: block.transactions
    };
  }
}