// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

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

struct RuneSlotInfo {
    int64 slotIndex;
    int64 runeId;
}