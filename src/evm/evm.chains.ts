import { Chain, defineChain } from 'viem';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChainManager {
  constructor(private config: ConfigService) {}

  public getChain(): Chain {
    const chain = this.config.get('evm.chain') ?? 'local_geth';
    switch (chain) {
      case 'mothership_testnet':
        return mothershipTestnet(this.config);
      case 'local_geth':
        return localGeth(this.config);
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
  }
}

const mothershipTestnet = (configure: ConfigService) => {
  return defineChain({
    id: configure.get('evm.mothership_testnet.chain_id') ?? 0,
    name: 'mothership_testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: [configure.get('evm.mothership_testnet.url.rpc') ?? ''],
      },
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: configure.get('evm.mothership_testnet.url.explorer') ?? '',
      },
    },
    contracts: {
      faultDisputeGameFactory: {
        address: configure.get(
          'evm.mothership_testnet.contracts.fault_dispute_game_factory.address',
        ),
        blockCreated: configure.get(
          'evm.mothership_testnet.contracts.fault_dispute_game_factory.block_created',
        ),
      },
    },
  });
};

const localGeth = (configure: ConfigService) => {
  return defineChain({
    id: configure.get('evm.local_geth.chain_id') ?? 0,
    name: 'local_geth',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: [configure.get('evm.local_geth.url.rpc') ?? ''],
      },
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: configure.get('evm.local_geth.url.explorer') ?? '',
      },
    },
    contracts: {
      faultDisputeGameFactory: {
        address: configure.get(
          'evm.local_geth.contracts.fault_dispute_game_factory.address',
        ),
        blockCreated: configure.get(
          'evm.local_geth.contracts.fault_dispute_game_factory.block_created',
        ),
      },
      preOracleVM: {
        address: configure.get(
          'evm.local_geth.contracts.pre_oracle_vm.address'
        ),
        blockCreated: configure.get(
          'evm.local_geth.contracts.pre_oracle_vm.block_created',
        ),
      },
      anchorStateRegistry: {
        address: configure.get(
          'evm.local_geth.contracts.anchor_state_registry.address',
        ),
        blockCreated: configure.get(
          'evm.local_geth.contracts.anchor_state_registry.block_created',
        ),
      },
      libplanetPortal: {
        address: configure.get(
          'evm.local_geth.contracts.libplanet_portal.address',
        ),
        blockCreated: configure.get(
          'evm.local_geth.contracts.libplanet_portal.block_created',
        ),
      },
      libplanetBridge: {
        address: configure.get(
          'evm.local_geth.contracts.libplanet_bridge.address',
        ),
        blockCreated: configure.get(
          'evm.local_geth.contracts.libplanet_bridge.block_created',
        ),
      },
    },
  });
};
