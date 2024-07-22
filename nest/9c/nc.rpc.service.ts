import { Injectable } from '@nestjs/common';
import { GraphQLClientService } from './graphql.client';
import { gql } from 'graphql-request';

@Injectable()
export class NCRpcService {
  constructor(private readonly graphqlClient: GraphQLClientService) {}

  async getBlocks(): Promise<BlockStruct[]> {
    const res = await this.graphqlClient.query(gql`
      query {
        nodeStatus {
          topmostBlocks(limit: 5) {
            index
            hash
            miner
          }
        }
      }
    `);

    const result: BlockStruct[] = [];
    res.nodeStatus.topmostBlocks.forEach(
      (block: { index: number; hash: string; miner: string }) => {
        result.push({
          index: block.index,
          hash: block.hash,
          miner: block.miner,
        });
      },
    );

    return result;
  }

  async getTransactions(): Promise<BlockWithTransactionsStruct> {
    const res = await this.graphqlClient.explorerQuery(gql`
      query	{
        blockQuery {
          blocks(desc: true, limit: 1) {
            index
            transactions {
              serializedPayload
            }
          }
        }
      }
    `);

    const result: BlockWithTransactionsStruct = {
      index: res.blockQuery.blocks[0].index,
      transactions: []
    };
    res.blockQuery.blocks[0].transactions.forEach(
      (transaction: { serializedPayload: string }) => {
        result.transactions.push({
          serializedPayload: transaction.serializedPayload,
        });
      },
    );

    return result;
  }
}

export type BlockStruct = {
  index: number;
  hash: string;
  miner: string;
};

export type BlockWithTransactionsStruct = {
  index: number;
  transactions: TransactionStruct[];
};

export type TransactionStruct = {
  serializedPayload: string;
};
