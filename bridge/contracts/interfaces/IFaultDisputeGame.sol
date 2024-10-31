// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import '../utils/Types.sol';

interface IFaultDisputeGame {
    /// @notice The `ClaimData` struct represents the data associated with a Claim.
    struct ClaimData {
        uint32 parentIndex;
        address counteredBy;
        address claimant;
        uint128 bond;
        Claim claim;
        Position position;
        Clock clock;
    }

    /// @notice The `ResolutionCheckpoint` struct represents the data associated with an in-progress claim resolution.
    struct ResolutionCheckpoint {
        bool initialCheckpointComplete;
        uint32 subgameIndex;
        Position leftmostPosition;
        address counteredBy;
    }

    event Move(uint256 indexed parentIndex, Claim indexed claim, address indexed claimant);

    event Resolved(uint256 indexed l2BlockNumber, Claim indexed rootClaim, GameStatus status);

    function initialize() external;

    function status() external view returns (GameStatus status_);

    function gameData() external pure returns (Claim rootClaim_, uint256 l2BlockNumber_);

    function rootClaim() external pure returns (Claim rootClaim_);

    function l2BlockNumber() external pure returns (uint256 l2BlockNumber_);
}