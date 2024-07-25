import { Injectable } from '@nestjs/common';
import { GraphQLClientService } from './graphql.client';
import { gql } from 'graphql-request';
import { TransactionResult } from './nc.transactionResult.model';

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

  async sendSimpleTransactionToLocalNetwork(simpleString: string): Promise<string> {
    const res = await this.graphqlClient.localExplorerQuery(gql`
      mutation {
        transactionMutation {
          simpleStringStage(simpleString: "${simpleString}")
        }
      }
    `);

    return res.transactionMutation.simpleStringStage;
  }

  async getTxResultsFromLocalNetwork(limit: number): Promise<TransactionResult[]> {
    const txIdsRes = await this.graphqlClient.localExplorerQuery(gql`
      query {
        transactionQuery {
          transactions (limit: ${limit}, desc: true) {
            id
          }
        }
      }
    `);
    
    const txResultList: TransactionResult[] = [];
    for (const tx of txIdsRes.transactionQuery.transactions) {
      const txResultsRes = await this.graphqlClient.localExplorerQuery(gql`
        query {
          transactionQuery {
            transactionResult(txId: "${tx.id}") {
              txStatus
              blockIndex
              blockHash
              inputState
              outputState
            }
          }
        }
      `);

      txResultList.push({
        txId: tx.id,
        txStatus: txResultsRes.transactionQuery.transactionResult.txStatus,
        blockIndex: BigInt(txResultsRes.transactionQuery.transactionResult.blockIndex),
        blockHash: txResultsRes.transactionQuery.transactionResult.blockHash,
        inputState: txResultsRes.transactionQuery.transactionResult.inputState,
        outputState: txResultsRes.transactionQuery.transactionResult.outputState,
      });
    }

    return txResultList;
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
