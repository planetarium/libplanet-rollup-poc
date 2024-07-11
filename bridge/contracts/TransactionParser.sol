// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { Transaction } from "./LibplanetCommonStructs.sol";

contract TransactionParser {
    event TransactionParsed(Transaction transaction);

    function transactionDeserializer(bytes memory input) public view returns (bool ok, bytes memory out) {
        address _addr = 0x0000000000000000000000000000000000000101;
        return _addr.staticcall(input);
    }

    function parseTransaction(bytes memory input) public returns (Transaction memory){
        (Transaction memory t) = abi.decode(input, (Transaction));
        emit TransactionParsed(t);
        return t;
    }

    function parseTransactionFromSerializedPayload(bytes memory input) public returns (Transaction memory){
        (bool ok, bytes memory out) = transactionDeserializer(input);
        require(ok, "Transaction deserialization failed");
        return parseTransaction(out);
    }
}