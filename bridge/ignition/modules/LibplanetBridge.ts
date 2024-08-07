import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const BridgeModule = buildModule('LibplanetBridge', (m) => {
  const owner = m.getAccount(0);
  const oracle = m.contract("LibplanetOutputOracle", [owner]);
  const portal = m.contract('LibplanetPortal', [oracle]);
  const bridge = m.contract('LibplanetBridge', [portal]);
  const messegner = m.contract('LibplanetCrossChainMessenger', [bridge]);

  return { portal, bridge, messegner };
});

export default BridgeModule;
