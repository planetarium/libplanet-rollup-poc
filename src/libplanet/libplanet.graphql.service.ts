import { Injectable } from "@nestjs/common";
import { GraphQLClientManager } from "./libplanet.graphql.client.manager";
import { gql } from "graphql-request";
import { sha256 } from "ethers";

@Injectable()
export class LibplanetGraphQLService {
  constructor(
    private readonly graphqlClient: GraphQLClientManager,
  ) {}

  async getRecentBlock() {
    const res = await this.graphqlClient.query(gql`
      query {
        blockQuery {
          blocks(desc: true, limit: 1){
            hash
            index
          }
        }
      }
    `);

    const block = res.blockQuery.blocks[0];

    return {
      hash: block.hash as string,
      index: BigInt(block.index)
    };
  }

  async getBlockByIndex(index: bigint) {
    const res = await this.graphqlClient.query(gql`
      query {
        blockQuery {
          block(index: ${Number(index)}) {
            hash
            index
            transactionHash
            transactions {
              serializedPayload
            }
          }
        }
      }
    `);

    return {
      hash: res.blockQuery.block.hash as string,
      index: BigInt(res.blockQuery.block.index),
      txHash: res.blockQuery.block.transactionHash as string,
      transactions: res.blockQuery.block.transactions
    };
  }

  async getBlockTimestampByIndex(index: bigint) {
    const res = await this.graphqlClient.query(gql`
      query {
        blockQuery {
          block(index: ${Number(index)}) {
            timestamp
          }
        }
      }
    `);

    return res.blockQuery.block.timestamp
  }

  async getOutputProposal(index?: bigint | undefined) {
    const arg = index === undefined ? '' : `(index: ${index})`;

    const res = await this.graphqlClient.query(gql`
      query {
        stateQuery {
          outputRoot ${arg} {
            blockIndex
            stateRootHash
            storageRootHash
          }
        }
      }
    `);

    if (res === null || res.stateQuery === null || res.stateQuery.outputRoot === null) {
      throw new Error('Failed to get output root proposal');
    }

    const resData = res.stateQuery.outputRoot;

    var blockIndex = BigInt(resData.blockIndex);
    
    var stateRootHash = Uint8Array.from(Buffer.from(resData.stateRootHash, 'hex'));
    var storageRootHash = Uint8Array.from(Buffer.from(resData.storageRootHash, 'hex'));
    
    var outputRootArray = new Uint8Array(64);
    outputRootArray.set(stateRootHash, 0);
    outputRootArray.set(storageRootHash, 32);  

    var outputRoot = sha256(outputRootArray);
    

    return {
      blockIndex: blockIndex,
      outputRoot: outputRoot,
    }
  }

  async sendSimpleTransaction(simpleString: string): Promise<string> {
    const res = await this.graphqlClient.query(gql`
      mutation {
        transactionMutation {
          simpleStringStage(simpleString: "${simpleString}")
        }
      }
    `);

    return res.transactionMutation.simpleStringStage;
  }
}