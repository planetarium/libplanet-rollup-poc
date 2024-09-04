import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract, sha256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mothership, opSepolia, localhost } from './chains';
import { ConfigService } from '@nestjs/config';
import { abi as outputOracleAbi } from './abi/LibplanetOutputOracle';
import { KeyManager } from '../key.utils';
import { OutputRootProposal } from '../9c/nc.respose.types';

@Injectable()
export class ProposeClientManager {
    constructor(
        private readonly configure: ConfigService,
        private readonly keyManager: KeyManager,
    ) {}

    private readonly chain = this.getChain(this.configure.get('wallet.chain', 'localhost'));
    private client = this.getClient();

    async proposeOutputRoot(outputRootProposal: OutputRootProposal): Promise<`0x${string}`> {
        const outputOracleContract = getContract({
          address: (this.chain.contracts?.libplanetOutputOracle as ChainContract).address,
          abi: outputOracleAbi,
          client: this.client,
        });
        
        var stateRootHash = Uint8Array.from(Buffer.from(outputRootProposal.stateRootHash, 'hex'));
        var storageRootHash = Uint8Array.from(Buffer.from(outputRootProposal.storageRootHash, 'hex'));
        
        var outputRootArray = new Uint8Array(64);
        outputRootArray.set(stateRootHash, 0);
        outputRootArray.set(storageRootHash, 32);  
    
        var outputRoot = sha256(outputRootArray);
    
        var blockIndex = BigInt(outputRootProposal.blockIndex);
    
        return await outputOracleContract.write.proposeL2Output([
          outputRoot,
          blockIndex,
        ])
    }

    private getChain(chain: string): Chain {
        switch (chain) {
          case 'mothership':
            return mothership;
          case 'opSepolia':
            return opSepolia;
          case 'localhost':
            return localhost(this.configure);
          default:
            throw new Error('Invalid chain');
        }
    }

    private getClient() {
        const account = privateKeyToAccount(
            this.chain.name === 'localhost' ?
            this.keyManager.getSubPrivateKeyFromKeyStore() :
            this.configure.get('wallet.private_key') as `0x${string}`,
        );
        return createWalletClient({
            chain: this.chain,
            account: account,
            transport: http(),
        });
    }
}