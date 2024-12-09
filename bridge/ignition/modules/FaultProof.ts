import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const FaultProofModule = buildModule('FaultProofModule', (m) => {
    const faultDisputeGameFactory = m.contract('FaultDisputeGameFactory');
    const anchorStateRegistry = m.contract('AnchorStateRegistry', [
        faultDisputeGameFactory,
        {
            root: "0xe3a161fc21b41f5fef06c09b3613cd69e7f9fe229e7d2b2b1f99ba9f06fb0974",
            l2BlockNumber: 10n
        }
    ]);

    const framePreInfoSize = m.getParameter('_framePreInfoSize', 22n);
    const framePostInfoSize = m.getParameter('_framePostInfoSize', 1n);

    const preOracleVM = m.contract('PreOracleVM', [framePreInfoSize, framePostInfoSize]);
    
    const maxGameDepth = m.getParameter('_maxGameDepth', 21n);
    const splitDepth = m.getParameter('_splitDepth', 15n);
    const maxClockDuration = m.getParameter('_maxClockDuration', 120n);
    const clockExtension = m.getParameter('_clockExtension', 40n);
    
    const faultDisputeGame = m.contract("FaultDisputeGame", [
        maxGameDepth, splitDepth, maxClockDuration, clockExtension, anchorStateRegistry, preOracleVM
    ]);

    m.call(faultDisputeGameFactory, 'setImplementation', [faultDisputeGame]);

    const libplanetPortal = m.contract('LibplanetPortal', [faultDisputeGameFactory]);
    const libplanetBridge = m.contract('LibplanetBridge', [libplanetPortal]);

    return { faultDisputeGameFactory, anchorStateRegistry, preOracleVM, faultDisputeGame, libplanetPortal, libplanetBridge };
});

export default FaultProofModule;
