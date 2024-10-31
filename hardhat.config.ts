import { HardhatUserConfig, task } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

dotenv.config({ path: join(__dirname, 'config', 'bridge.env') });

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  paths: {
    root: './bridge',
  },
  networks: {
    mothership_testnet: {
      url: process.env.MOTHERSHIP_TESTNET_RPC_URL,
      chainId: parseInt(process.env.MOTHERSHIP_TESTNET_CHAIN_ID ?? '0'),
      accounts: [process.env.MAIN_PRIVATE_KEY ?? ''],
    },
    local_geth: {
      url: process.env.LOCAL_GETH_RPC_URL,
      chainId: 12345
    },
  },
};

const asyncExec = promisify(exec);

task('compile', async (taskArgs, hre, runSuper) => {
  await runSuper();

  const copyContractNames = [
    'FaultDisputeGame', 
    'FaultDisputeGameFactory',
    'AnchorStateRegistry'
  ];
  const nestJsAbiPath = '../../src/evm/abis';

  for (const contractName of copyContractNames) {
    console.log(`Copying ABI for ${contractName} to NestJS...`);
    // Run the ABI copy script
    try {
      const { stdout, stderr } = await asyncExec(
        `node bridge/scripts/copyAbi.ts ${contractName} ${nestJsAbiPath}`,
      );
      console.log(stdout);
      console.error(stderr);
    } catch (err) {
      console.error(`Error copying ABI: ${err}`);
    }
  }
});

export default config;
