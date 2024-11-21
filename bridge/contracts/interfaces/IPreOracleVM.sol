// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "../utils/Types.sol";

interface IPreOracleVM {
  function step(Claim _preStateClaim, bytes memory _batchIndexData) external pure returns (Claim);
}