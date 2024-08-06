// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract LibplanetOutputOracle {
    struct OutputProposal {
        bytes32 outputRoot;
        uint256 l2BlockNumber;
        uint256 l1Timestamp;
    }

    OutputProposal[] internal l2Outputs;

    address public immutable PROPOSER;
    
    event OutputProposed(
        bytes32 indexed outputRoot,
        uint256 indexed l2OutputIndex,
        uint256 indexed l2BlockNumber,
        uint256 l1Timestamp
    );

    constructor(
        address _proposer
    ) {
        PROPOSER = _proposer;
    }

    function proposeL2Output(
        bytes32 _outputRoot,
        uint256 _l2BlockNumber
    ) public {
        require(msg.sender == PROPOSER, "Only proposer can propose");
        require(latestBlockNumber() < _l2BlockNumber, "Invalid block number");
        require(_outputRoot != bytes32(0), "Invalid output root");

        emit OutputProposed(_outputRoot, nextOutputIndex(), _l2BlockNumber, block.timestamp);

        l2Outputs.push(OutputProposal(_outputRoot, _l2BlockNumber, block.timestamp));
    }

    function latestBlockNumber() public view returns (uint256) {
        return l2Outputs.length == 0 ? 0 : l2Outputs[l2Outputs.length - 1].l2BlockNumber;
    }

    function nextOutputIndex() public view returns (uint256) {
        return l2Outputs.length;
    }
}