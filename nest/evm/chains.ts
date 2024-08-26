import { defineChain } from 'viem';
import { ConfigService } from '@nestjs/config';

export const mothership = defineChain({
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

const sourceId = 11_155_111; // sepolia

export const opSepolia = defineChain({
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

export const localhost = (configure: ConfigService) => {
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
        // todo: process.env.LOCAL_RPC_URL is not working at here
        http: [process.env.LOCAL_RPC_URL ?? 'http://localhost:8545'],
      },
    },
    contracts: {
      libplanetPortal: {
        address: configure.get('local_contract_address.libplanet_portal'),
      },
      libplanetBridge: {
        address: configure.get('local_contract_address.libplanet_bridge'),
      },
      libplanetOutputOracle: {
        address: configure.get('local_contract_address.libplanet_output_oracle'),
      },
    },
  });
}