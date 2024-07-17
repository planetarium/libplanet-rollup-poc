import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LibplanetTransactionProcessorModule = buildModule("LibplanetTransactionProcessorModule", (m) => {

  const libplanetTransactionProcessor = m.contract("LibplanetTransactionProcessor");

  return { libplanetTransactionProcessor };
});

export default LibplanetTransactionProcessorModule;