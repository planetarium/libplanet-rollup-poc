// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./TransactionParser.sol";

contract LibplanetTransactionProcessor is TransactionParser {
    enum Status {
        Processing,
        Processed,
        Failed
    }

    event TransactionProcessed(uint256 indexed blockIndex, Status status);
    event TransactionData(bytes data);

    function processTransaction(uint256 blockIndex, bytes[] memory input) public {
        emit TransactionProcessed(blockIndex, Status.Processing);
        (bytes memory data) = abi.decode(input[0], (bytes));
        emit TransactionData(data);
        emit TransactionProcessed(blockIndex, Status.Processed);
    }
}