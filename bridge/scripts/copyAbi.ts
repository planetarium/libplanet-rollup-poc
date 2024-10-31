/* eslint-disable */
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

function copyAbi(contractName, outputDir) {
  const contractPath = join(
    __dirname,
    `../artifacts/contracts/${contractName}.sol/${contractName}.json`,
  );
  const abiOutputPath = join(__dirname, outputDir, `${contractName}.abi.ts`);

  // Check if contract JSON exists
  if (existsSync(contractPath)) {
    const contractJson = JSON.parse(readFileSync(contractPath, 'utf-8'));

    // Extract the ABI from the compiled contract JSON
    const abi = contractJson.abi;

    // Write ABI to target folder (NestJS project)
    const content = `export const ${contractName}Abi = ${JSON.stringify(abi, null, 2)} as const;`;
    writeFileSync(abiOutputPath, content);
    console.log(`ABI for ${contractName} copied to ${abiOutputPath}`);
  } else {
    console.error(`Contract ${contractName}.json not found in artifacts.`);
  }
}

// Call the function for the specific contract and output folder
const contractName = process.argv[2]; // Pass contract name as command-line argument
const nestJsAbiPath = process.argv[3]; // Pass the NestJS ABI folder path as command-line argument

if (contractName && nestJsAbiPath) {
  copyAbi(contractName, nestJsAbiPath);
} else {
  console.error('Please provide both contract name and NestJS ABI path.');
}
