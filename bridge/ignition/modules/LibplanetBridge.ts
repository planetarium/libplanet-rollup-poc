import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const BridgeModule = buildModule('LibplanetBridge', (m) => {
  const owner = m.getAccount(1);
  const oracle = m.contract("LibplanetOutputOracle", [owner]);
  const portal = m.contract('LibplanetPortal', [oracle]);
  const bridge = m.contract('LibplanetBridge', [portal]);

  return { portal, bridge };
});

export default BridgeModule;
