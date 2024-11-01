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

  async init() {
    const block = await this.graphQlService.getBlockWithIndex(BigInt(5));
    const batch = this.blockToBatch(block);

    const hash = Buffer.from(batch.hash);
    const index = this.bigintToUint8Array(batch.index);
    const txHash = Buffer.from(batch.txHash);
    for (const tx of batch.transactions) {
      const txLength = this.numberToUint8Array(tx.length);
      const txData = Buffer.from(tx);
    }
    
    const bigintIndex = this.uint8ArrayToBigint(index);
    
    return
  }

  private blockToBatch(block: Block): Batch {
    return {
        hash: block.hash,
        index: block.index,
        txHash: block.txHash,
        transactions: block.transactions.map(tx => 
            Buffer.from(tx.serializedPayload, 'base64'))
    }
  }

  private numberToUint8Array(value: number): Uint8Array {
    const data = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
      data[i] = (value >> 8 * (3 - i)) & 0xff;
    }
    return data;
  }

  private bigintToUint8Array(value: bigint): Uint8Array {
    const data = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      data[i] = Number((value >> BigInt(8 * (7 - i))) & BigInt(0xff));
    }
    return data;
  }

  private uint8ArrayToBigint(data: Uint8Array): bigint {
    let value = BigInt(0);
    for (let i = 0; i < 8; i++) {
      value = value | BigInt(data[i]) << BigInt(8 * (7 - i));
    }
    return value;
  }
}