import { Injectable } from '@nestjs/common';
import { GraphQLClientService } from './graphql.client';
import { gql } from 'graphql-request';
import { Block, BlockStruct, BlockWithTransactionsStruct, OutputRootProposal, TransactionResult, TransactionWorldProof, WithdrawalTransaction } from './nc.respose.types';
import { Address } from 'viem';
import { KeyManager } from 'nest/key.utils';

@Injectable()
export class NCRpcService {
  constructor(
    private readonly graphqlClient: GraphQLClientService,
    private readonly keyManager: KeyManager,
  ) {}

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

  async getTxResults(limit: number): Promise<TransactionResult[]> {
    const txIdsRes = await this.graphqlClient.query(gql`
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
      const txResultsRes = await this.graphqlClient.query(gql`
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

  async getTxWorldProofs(limit: number): Promise<TransactionWorldProof[]> {
    const txIdsRes = await this.graphqlClient.query(gql`
      query {
        transactionQuery {
          transactions (limit: ${limit}, desc: true) {
            id
          }
        }
      }
    `);
    
    const txWorldProofList: TransactionWorldProof[] = [];
    for (const tx of txIdsRes.transactionQuery.transactions) {
      const txWorldProofRes = await this.graphqlClient.query(gql`
        query {
          transactionQuery {
            transactionWorldProof(
              txId: "${tx.id}",
            ) {
              stateRootHash
              proof {
                hex
              }
              key
              value {
                hex
              }
            }
          }
        }
      `);

      txWorldProofList.push({
        txId: tx.id,
        stateRootHash: txWorldProofRes.transactionQuery.transactionWorldProof.stateRootHash,
        proof: txWorldProofRes.transactionQuery.transactionWorldProof.proof.hex,
        key: txWorldProofRes.transactionQuery.transactionWorldProof.key,
        value: txWorldProofRes.transactionQuery.transactionWorldProof.value.hex,
      });
    }

    return txWorldProofList;
  }

  async mintWeth(recipient: Address, amount: bigint): Promise<boolean> {
    const res = await this.graphqlClient.query(gql`
      mutation {
        transactionMutation {
          mintWETH(
            privateKey: "${this.keyManager.getPrivateKeyFromKeyStore().slice(2)}",
            recipient: "${recipient.slice(2)}",
            amount: ${amount}
          )
        }
      }
    `);

    if(res.transactionMutation.mintWETH === "success") {
      return true;
    }

    return false;
  }

  async withdrawEth(privateKey: `0x${string}`, recipient: Address, amount: bigint): Promise<string> {
    const res = await this.graphqlClient.query(gql`
      mutation {
        transactionMutation {
          withdrawETH(
            privateKey: "${privateKey.slice(2)}",
            recipient: "${recipient.slice(2)}",
            amount: ${amount}
          )
        }
      }
    `);

    return res.transactionMutation.withdrawETH;
  }

  async getOutputRootProposal(index?: bigint | undefined): Promise<OutputRootProposal> {
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

    return {
      blockIndex: BigInt(res.stateQuery.outputRoot.blockIndex),
      stateRootHash: res.stateQuery.outputRoot.stateRootHash,
      storageRootHash: res.stateQuery.outputRoot.storageRootHash,
    };
  }

  async getBlockIndexWithTxId(txId: string): Promise<bigint> {
    const res = await this.graphqlClient.query(gql`
      query {
        transactionQuery {
          transactionResult(
            txId: "${txId}"
          ) {
            blockIndex
          }
        }
      }
    `);

    return BigInt(res.transactionQuery.transactionResult.blockIndex);
  }

  async getWithdrawalProof(storageRootHash: string, txId: string): Promise<{withdrawalInfo: WithdrawalTransaction, proof: string}> {
    const res = await this.graphqlClient.query(gql`
      query {
        stateQuery {
          withdrawalProof(
            storageRootHash: "${storageRootHash}",
            txId: "${txId}"
          ) {
            withdrawalInfo {
              nonce
              from
              to
              amount
            }
            proof {
              hex
            }
          }
        }
      }
    `);

    return {
      withdrawalInfo: {
        nonce: BigInt(res.stateQuery.withdrawalProof.withdrawalInfo.nonce),
        from: res.stateQuery.withdrawalProof.withdrawalInfo.from,
        to: res.stateQuery.withdrawalProof.withdrawalInfo.to,
        amount: BigInt(res.stateQuery.withdrawalProof.withdrawalInfo.amount),
      },
      proof: res.stateQuery.withdrawalProof.proof.hex,
    };
  }

  async getRecentBlock(): Promise<{
    hash: string;
    index: bigint;
  }> {
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

    return {
      hash: res.blockQuery.blocks[0].hash,
      index: BigInt(res.blockQuery.blocks[0].index)
    };
  }

  async getBlockWithIndex(index: bigint): Promise<Block> {
    const res = await this.graphqlClient.query(gql`
      query {
        blockQuery {
          block(index: ${Number(index)}) {
            hash
            index
            miner
            transactions {
              serializedPayload
            }
          }
        }
      }
    `);

    return {
      hash: res.blockQuery.block.hash,
      index: BigInt(res.blockQuery.block.index),
      miner: res.blockQuery.block.miner,
      transactions: res.blockQuery.block.transactions
    };
  }

  async getWethBalance(address: Address): Promise<bigint> {
    var recentBlockInfo = await this.getRecentBlock();
    const res = await this.graphqlClient.query(gql`
      query {
        stateQuery {
          balance(
            offsetBlockHash: "${recentBlockInfo.hash}",
            owner: "${address.slice(2)}",
            currency: {
              ticker: "WETH",
              decimalPlaces: 18,
              minters: [
                "CE70F2e49927D431234BFc8D439412eef3a6276b"
              ],
              totalSupplyTrackable: true
            }
          ) {
            currency {
              ticker
            }
            majorUnit
            minorUnit
            quantity
          }
        }
      }
    `);

    var majorUnit = BigInt(res.stateQuery.balance.majorUnit) * (BigInt(10) ** BigInt(18));
    var minorUnit = BigInt(res.stateQuery.balance.minorUnit);
    return majorUnit + minorUnit;
  }
}
