import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LibplanetTransactionResultsStoreModule = buildModule("LibplanetTransactionResultsStoreModule", (m) => {

  const libplanetTransactionResultsStore = m.contract("LibplanetTransactionResultsStore");

  return { libplanetTransactionResultsStore };
});

export default LibplanetTransactionResultsStoreModule;
