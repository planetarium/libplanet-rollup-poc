import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TransactionParserModule = buildModule("TransactionParserModule", (m) => {

  const transactionParser = m.contract("TransactionParser");

  return { transactionParser };
});

export default TransactionParserModule;
