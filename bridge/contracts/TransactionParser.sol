// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { FungibleAssetValue } from "./utils/LibplanetCommonStructs.sol";

contract TransactionParser {
    struct Transaction {
        bytes signature;
        Action[] actions;
        bytes32 genesisHash;
        int64 gasLimit;
        FungibleAssetValue maxGasPrice;
        int64 nonce;
        bytes publicKey;
        address signer;
        uint256 timestamp;
        address[] updatedAddresses;
    }

    struct Action {
        string typeId;
        bytes value;
    }

    event TransactionParsed(Transaction transaction);
    
    function transactionDeserializer(bytes memory input) private view returns (bool ok, bytes memory out) {
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