// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "../utils/Types.sol";

interface IPreOracleVM {
  function step(Claim _preStateClaim,uint256 _blockNumber, uint256 _transactionIndex, bytes memory _batchIndexData) external view returns (Claim);
}