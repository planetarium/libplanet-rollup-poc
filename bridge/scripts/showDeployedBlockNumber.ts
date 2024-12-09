/* eslint-disable */
const { existsSync, createReadStream } = require('fs');
const { createInterface } = require('readline');
const { join } = require('path');

import { ethers } from "hardhat";


function showDeployedBlockNumber() {
  const chainId = '12345';

  const contractNameList = [
    'FaultDisputeGame',
    'FaultDisputeGameFactory',
    'AnchorStateRegistry',
    'PreOracleVM',
    'LibplanetBridge',
    'LibplanetPortal',
  ];

  const journalPath = join(
    __dirname,
    `../ignition/deployments/chain-${chainId}/journal.jsonl`,
  );

  if (existsSync(journalPath)) {
    parseJsonlFile(journalPath).then(async (jsonList) => {
      for(const jsonObj of jsonList) {
        const keys = Object.keys(jsonObj);
        if (!keys.includes('futureId') || !keys.includes('hash')) {
          continue;
        }

        const futureId = jsonObj['futureId'];
        const contractName = contractNameList.find((name) => name === futureId.split('#')[1]);
        if (contractName) {
          const hash = jsonObj['hash'];
          const receipt = await ethers.provider.getTransactionReceipt(hash);
          console.log(`Deployed ${contractName} at block ${receipt?.blockNumber}`);
        }
      }
      console.log(`Found ${jsonList.length} entries in journal.jsonl`);
    });
  } else {
    console.error(`File not found: ${journalPath}`);
  }
}

async function parseJsonlFile(filePath) {
  const result: any[] = [];

  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.length === 0) {
      continue;
    }
    try {
      // Parse each line as JSON and push to the result array
      const jsonObj = JSON.parse(line);
      result.push(jsonObj);
    } catch (error) {
      console.error(`Error parsing line: ${line}`, error);
    }
  }

  return result;
}

showDeployedBlockNumber();
