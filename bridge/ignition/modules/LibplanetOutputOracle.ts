import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LibplanetOutputOracleModule = buildModule("LibplanetOutputOracleModule", (m) => {
  const owner = m.getAccount(0);
  const libplanetOutputOracle = m.contract("LibplanetOutputOracle", [owner]);

  return { libplanetOutputOracle };
});

export default LibplanetOutputOracleModule;
