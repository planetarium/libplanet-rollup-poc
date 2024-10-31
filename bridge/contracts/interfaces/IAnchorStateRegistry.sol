// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { IFaultDisputeGameFactory } from "./IFaultDisputeGameFactory.sol";

import "../utils/Types.sol";

interface IAnchorStateRegistry {
  function anchor() external view returns (Hash, uint256);

  function faultDisputeGameFactory() external view returns (IFaultDisputeGameFactory);

  function tryUpdateAnchorState() external;
}