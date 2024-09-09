import { Injectable, Logger } from '@nestjs/common';
import { createWalletClient, http, Chain, getContract, ChainContract, sha256 } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ConfigService } from '@nestjs/config';
import { abi as outputOracleAbi } from './abi/LibplanetOutputOracle';
import { KeyManager } from '../key.utils';
import { OutputRootProposal } from '../9c/nc.respose.types';
import { ChainManager } from './evm.chains';

@Injectable()
export class ProposeClientManager {
    constructor(
        private readonly configure: ConfigService,
        private readonly keyManager: KeyManager,
        private readonly chainManger: ChainManager,
    ) {}

    private readonly chain = this.chainManger.getChain();
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

    private getClient() {
        const account = privateKeyToAccount(
          this.keyManager.getSubPrivateKeyFromKeyStore()
        );
        return createWalletClient({
            chain: this.chain,
            account: account,
            transport: http(),
        });
    }
}