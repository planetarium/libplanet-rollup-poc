// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { IAnchorStateRegistry } from "./interfaces/IAnchorStateRegistry.sol";
import { IFaultDisputeGameFactory } from "./interfaces/IFaultDisputeGameFactory.sol";
import { IFaultDisputeGame } from "./interfaces/IFaultDisputeGame.sol";

import "./utils/Types.sol";

contract AnchorStateRegistry is IAnchorStateRegistry {
  IFaultDisputeGameFactory internal immutable FAULT_DISPUTE_GAME_FACTORY;
  OutputRoot public anchor;

  constructor(
    IFaultDisputeGameFactory _faultDisputeGameFactory,
    OutputRoot memory _startingOutputRoot
  ) {
    FAULT_DISPUTE_GAME_FACTORY = _faultDisputeGameFactory;

    initialize(_startingOutputRoot);
  }

  function initialize(OutputRoot memory _startingOutputRoot) private {
    anchor = _startingOutputRoot;
  }

  function faultDisputeGameFactory() external view override returns (IFaultDisputeGameFactory) {
    return FAULT_DISPUTE_GAME_FACTORY;
  }

  function tryUpdateAnchorState() external override {
    IFaultDisputeGame faultDisputeGame = IFaultDisputeGame(msg.sender);
    (Claim rootClaim, uint256 l2BlockNumber) = faultDisputeGame.gameData();
    (IFaultDisputeGame proxy, ) = FAULT_DISPUTE_GAME_FACTORY.games(rootClaim, l2BlockNumber);

    require(
      address(proxy) == address(faultDisputeGame),
      "AnchorStateRegistry: fault dispute game not registered with factory"
    );

    if(faultDisputeGame.l2BlockNumber() <= anchor.l2BlockNumber) {
      return;
    }

    if(faultDisputeGame.status() != GameStatus.DEFENDER_WINS) {
      return;
    }

    anchor = OutputRoot(
        Hash.wrap(faultDisputeGame.rootClaim().raw()), 
        faultDisputeGame.l2BlockNumber()
      );
  }

  function getAnchor() external view returns (OutputRoot memory) {
    return anchor;
  }
}