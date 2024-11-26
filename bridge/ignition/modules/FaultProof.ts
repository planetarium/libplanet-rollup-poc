import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const FaultProofModule = buildModule('FaultProofModule', (m) => {
    const faultDisputeGameFactory = m.contract('FaultDisputeGameFactory');
    const anchorStateRegistry = m.contract('AnchorStateRegistry', [
        faultDisputeGameFactory,
        {
            root: "0xb725841ac078ee2a313cee3d9dede3492cc61e3a5439f2bcb289fc5b89d71d99",
            l2BlockNumber: 10n
        }
    ]);
    const preOracleVM = m.contract('PreOracleVM');
    
    const maxGameDepth = m.getParameter('_maxGameDepth', 21n);
    const splitDepth = m.getParameter('_splitDepth', 15n);
    const maxClockDuration = m.getParameter('_maxClockDuration', 120n);
    const clockExtension = m.getParameter('_clockExtension', 40n);
    
    const faultDisputeGame = m.contract("FaultDisputeGame", [
        maxGameDepth, splitDepth, maxClockDuration, clockExtension, anchorStateRegistry, preOracleVM
    ]);

    m.call(faultDisputeGameFactory, 'setImplementation', [faultDisputeGame]);

    return { faultDisputeGameFactory, anchorStateRegistry, preOracleVM, faultDisputeGame };
});

export default FaultProofModule;
