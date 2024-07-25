import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LibplanetProofVerifierModule = buildModule("LibplanetProofVerifierModule", (m) => {

  const libplanetProofVerifier = m.contract("LibplanetProofVerifier");

  return { libplanetProofVerifier };
});

export default LibplanetProofVerifierModule;
