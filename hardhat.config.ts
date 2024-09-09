import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, 'config', 'bridge.env') });

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  paths: {
    root: './bridge',
  },
  networks: {
    mothership: {
      url: process.env.MOTHERSHIP_RPC_URL,
      accounts: [process.env.FIRST_PRIVATE_KEY ?? ''],
    },
    mothership_testnet: {
      url: process.env.MOTHERSHIP_TESTNET_RPC_URL,
      chainId: 16777215,
      accounts: [
        process.env.FIRST_PRIVATE_KEY ?? '',
        process.env.SECOND_PRIVATE_KEY ?? ''
      ],
    },
    localhost: {
      url: process.env.LOCAL_RPC_URL,
      chainId: 12346
    },
  },
};

export default config;
