import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import FaultProofModule from './FaultProof';

const LibplanetBridgeModule = buildModule('LibplanetBridgeModule', (m) => {
    const { faultDisputeGameFactory } = m.useModule(FaultProofModule);

    const libplanetPortal = m.contract('LibplanetPortal', [faultDisputeGameFactory]);
    const libplanetBridge = m.contract('LibplanetBridge', [libplanetPortal]);

    return { libplanetPortal, libplanetBridge };
});

export default LibplanetBridgeModule;
