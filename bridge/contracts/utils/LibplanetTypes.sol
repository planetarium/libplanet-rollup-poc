// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

library Types {
    struct OutputProposal {
        bytes32 outputRoot;
        uint256 l2BlockNumber;
        uint256 l1Timestamp;
    }

    struct OutputRootProof {
        bytes32 stateRoot;
        bytes32 storageRoot;
    }

    struct WithdrawalTransaction {
        uint256 nonce;
        address from;
        address to;
        uint256 amount;
    }
}