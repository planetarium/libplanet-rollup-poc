// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

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