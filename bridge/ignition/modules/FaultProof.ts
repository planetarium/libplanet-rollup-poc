import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const FaultProofModule = buildModule('FaultProofModule', (m) => {
    const faultDisputeGameFactory = m.contract('FaultDisputeGameFactory');
    const anchorStateRegistry = m.contract('AnchorStateRegistry', [
        faultDisputeGameFactory,
        {
            root: "0x0000000000000000000000000000000000000000000000000000000000000001",
            l2BlockNumber: 0n
        }
    ]);
    
    const maxGameDepth = m.getParameter('_maxGameDepth', 23n);
    const splitDepth = m.getParameter('_splitDepth', 14n);
    const maxClockDuration = m.getParameter('_maxClockDuration', 120n);
    const clockExtension = m.getParameter('_clockExtension', 40n);
    
    const faultDisputeGame = m.contract("FaultDisputeGame", [
        maxGameDepth, splitDepth, maxClockDuration, clockExtension, anchorStateRegistry
    ]);

    m.call(faultDisputeGameFactory, 'setImplementation', [faultDisputeGame]);

    return { faultDisputeGameFactory, anchorStateRegistry, faultDisputeGame };
});

export default FaultProofModule;
