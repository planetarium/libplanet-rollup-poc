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
    event TransactionParsedIndex(uint256 indexed blockIndex, uint transactionIndex);

    function processTransaction(uint256 blockIndex, bytes[] memory input) public {
        emit TransactionProcessed(blockIndex, Status.Processing);
        for(uint i = 0; i < input.length; i++) {
            parseTransactionFromSerializedPayload(input[i]);
            emit TransactionParsedIndex(blockIndex, i);
        }
        
        emit TransactionProcessed(blockIndex, Status.Processed);
    }
}