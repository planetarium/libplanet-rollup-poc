import { Chain, defineChain } from 'viem';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChainManager {
  constructor(private configure: ConfigService) {}

  public getChain(): Chain {
    var chain = this.configure.get('wallet.chain', 'localhost');

    switch (chain) {
      case 'mothership':
        return mothership;
      case 'mothership_testnet':
        return mothershipTestnet(this.configure);
      case 'opSepolia':
        return opSepolia;
      case 'localhost':
        return localhost(this.configure);
      default:
        throw new Error('Invalid chain');
    }
  }
}

const mothership = defineChain({
  id: 17000133712,
  name: 'Mothership',
  nativeCurrency: {
    decimals: 18,
    name: 'MHOLETH',
    symbol: 'MHOLETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.holesky.tests.mothership-pla.net'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: 'https://explorer.holesky.tests.mothership-pla.net',
    },
  },
  contracts: {
    libplanetPortal: {
      address: '0x5F0641fAa5bd2364F0992fD7721975A7f604D5c5',
    },
    libplanetBridge: {
      address: '0x13D12eE50497944666D0C9140c3cc12b6E80376b',
    },
  },
});

const mothershipTestnet = (configure: ConfigService) => {
  return defineChain({
    id: 16777215,
    name: 'mothership_testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['http://node-1.testnet.holesky.tests.mothership-pla.net'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Explorer',
        url: 'http://k8s-holeskyt-blocksco-d9df52ff7a-4a659d4af5aab826.elb.us-east-2.amazonaws.com/',
      },
    },
    contracts: {
      libplanetPortal: {
        address: configure.get('contracts.mothership_testnet.libplanet_portal.address'),
        blockCreated: configure.get('contracts.mothership_testnet.libplanet_portal.block_created'),
      },
      libplanetBridge: {
        address: configure.get('contracts.mothership_testnet.libplanet_bridge.address'),
        blockCreated: configure.get('contracts.mothership_testnet.libplanet_bridge.block_created'),
      },
      libplanetOutputOracle: {
        address: configure.get('contracts.mothership_testnet.libplanet_output_oracle.address'),
        blockCreated: configure.get('contracts.mothership_testnet.libplanet_output_oracle.block_created'),
      },
    },
  });
}

const sourceId = 11_155_111; // sepolia

const opSepolia = defineChain({
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://sepolia.optimism.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://optimism-sepolia.blockscout.com',
      apiUrl: 'https://optimism-sepolia.blockscout.com/api',
    },
  },
  contracts: {
    disputeGameFactory: {
      [sourceId]: {
        address: '0x05F9613aDB30026FFd634f38e5C4dFd30a197Fa1',
      },
    },
    l2OutputOracle: {
      [sourceId]: {
        address: '0x90E9c4f8a994a250F6aEfd61CAFb4F2e895D458F',
      },
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1620204,
    },
    portal: {
      [sourceId]: {
        address: '0x16Fc5058F25648194471939df75CF27A2fdC48BC',
      },
    },
    l1StandardBridge: {
      [sourceId]: {
        address: '0xFBb0621E0B23b5478B630BD55a5f21f67730B0F1',
      },
    },
  },
  testnet: true,
});

const localhost = (configure: ConfigService) => {
  return defineChain({
    id: 12346,
    name: 'localhost',
    nativeCurrency: {
      decimals: 18,
      name: 'Geth Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        // todo: it seems process.env.LOCAL_RPC_URL is not working at here
        http: [process.env.LOCAL_RPC_URL ?? 'http://localhost:8545'],
      },
    },
    contracts: {
      libplanetPortal: {
        address: configure.get('contracts.local.libplanet_portal.address'),
        blockCreated: configure.get('contracts.local.libplanet_portal.block_created'),
      },
      libplanetBridge: {
        address: configure.get('contracts.local.libplanet_bridge.address'),
        blockCreated: configure.get('contracts.local.libplanet_bridge.block_created'),
      },
      libplanetOutputOracle: {
        address: configure.get('contracts.local.libplanet_output_oracle.address'),
        blockCreated: configure.get('contracts.local.libplanet_output_oracle.block_created'),
      },
    },
  });
}
