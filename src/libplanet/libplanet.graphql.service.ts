import { Injectable } from "@nestjs/common";
import { GraphQLClientManager } from "./libplanet.graphql.client.manager";
import { gql } from "graphql-request";
import { sha256 } from "ethers";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LibplanetGraphQLService {
  constructor(
    private readonly configService: ConfigService,
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

  async getBlockByIndex(index: bigint, includeTxIds: boolean = false) {
    const res = await this.graphqlClient.query(gql`
      query {
        blockQuery {
          block(index: ${Number(index)}) {
            hash
            index
            transactionHash
            transactions {
              ${includeTxIds ? 'id' : ''}
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

  async getTransactionResult(txId: string): Promise<string> {
    const res = await this.graphqlClient.query(gql`
      query {
        transactionQuery {
          transactionResult(txId: "${txId}") {
            outputState
          }
        }
      }
    `);

    return res.transactionQuery.transactionResult.outputState;
  }

  async getStorageRootHash(offsetStateRootHash: string): Promise<string> {
    const res = await this.graphqlClient.query(gql`
      query {
        stateQuery {
          withdrawalState (
            offsetStateRootHash: "${offsetStateRootHash}"
          )
        }
      }
    `);

    return res.stateQuery.withdrawalState;
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

  async mintWeth(recipient: `0x${string}`, amount: bigint): Promise<boolean> {
    const minterPrivateKey = this.configService.get<string>('libplanet.console.private_key.weth_minter');
    const res = await this.graphqlClient.query(gql`
      mutation {
        transactionMutation {
          mintWETH(
            privateKey: "${minterPrivateKey?.slice(2)}",
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

  async getWethBalance(address: `0x${string}`): Promise<bigint> {
    const minterAddress = this.configService.get<string>('libplanet.console.addresses.weth_minter');
    const decimalPlaces = 18;
    var recentBlockInfo = await this.getRecentBlock();
    const res = await this.graphqlClient.query(gql`
      query {
        stateQuery {
          balance(
            offsetBlockHash: "${recentBlockInfo.hash}",
            owner: "${address.slice(2)}",
            currency: {
              ticker: "WETH",
              decimalPlaces: ${decimalPlaces},
              minters: [
                "${minterAddress?.slice(2)}"
              ],
              totalSupplyTrackable: true
            }
          ) {
            majorUnit
            minorUnit
          }
        }
      }
    `);

    var majorUnit = BigInt(res.stateQuery.balance.majorUnit) * (BigInt(10) ** BigInt(decimalPlaces));
    var minorUnit = BigInt(res.stateQuery.balance.minorUnit);
    return majorUnit + minorUnit;
  }
}