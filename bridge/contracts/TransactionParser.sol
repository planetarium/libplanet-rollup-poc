// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

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

    struct FungibleAssetValue {
        Currency currency;
        uint256 rawValue;
    }

    struct Currency {
        uint8 decimalPlaces;
        address[] minters;
        string ticker;
        bool totalSupplyTrackable; // false if null
        uint256 maximumSupplyMajor; // 0 if null
        uint256 maximumSupplyMinor; // 0 if null
    }

    event TransactionParsed(Transaction transaction);

    function transactionDeserializer(bytes memory input) public view returns (bool ok, bytes memory out) {
        address _addr = 0x0000000000000000000000000000000000000101;
        return _addr.staticcall(input);
    }

    function parseTransaction(bytes memory input) public returns (Transaction memory){
        (bool ok, bytes memory out) = transactionDeserializer(input);
        require(ok, "Transaction deserialization failed");
        (Transaction memory t) = abi.decode(out, (Transaction));
        emit TransactionParsed(t);
        return t;
    }
}