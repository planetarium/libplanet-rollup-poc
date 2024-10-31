// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { IFaultDisputeGame } from './IFaultDisputeGame.sol';

import '../utils/Types.sol';

interface IFaultDisputeGameFactory {
  function games(Claim _rootClaim, uint256 _l2BlockNumber) external view returns (IFaultDisputeGame proxy_, Timestamp timestamp_);
}