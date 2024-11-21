import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const PreOracleVmModule = buildModule('PreOracleVmModule', (m) => {
    const preOracleVM = m.contract('PreOracleVM');

    return { preOracleVM };
});

export default PreOracleVmModule;
