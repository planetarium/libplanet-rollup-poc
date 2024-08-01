import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WNCGTokenModule = buildModule("WNCGTokenModule", (m) => {

  const wNCGToken = m.contract("WNCGToken");

  return { wNCGToken };
});

export default WNCGTokenModule;
