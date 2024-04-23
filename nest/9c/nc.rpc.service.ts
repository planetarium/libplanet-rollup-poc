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
    res.nodeStatus.topmostBlocks.forEach((block) => {
      result.push({
        index: block.index,
        hash: block.hash,
        miner: block.miner,
      });
    });

    return result;
  }
}

export type BlockStruct = {
  index: 'number';
  hash: 'string';
  miner: 'string';
};
