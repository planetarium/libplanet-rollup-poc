import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const BridgeModule = buildModule('LibplanetBridge', (m) => {
  const portal = m.contract('LibplanetPortal');
  const bridge = m.contract('LibplanetBridge', [portal]);
  const messegner = m.contract('LibplanetCrossChainMessenger', [bridge]);

  return { portal, bridge, messegner };
});

export default BridgeModule;
