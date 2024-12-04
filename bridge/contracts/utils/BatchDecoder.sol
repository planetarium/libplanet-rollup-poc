// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import './Types.sol';

library BatchDecoder {
    function decodeBatch(bytes memory data) internal pure returns (Batch memory) {
        require(data.length >= 64, "Invalid data length");

        // Extract hash
        bytes memory hash = slice(data, 0, 64);
        data = slice(data, 64, data.length - 64);

        // Extract index
        require(data.length >= 8, "Invalid data length");
        uint256 index = uint8ArrayToBigInt(slice(data, 0, 8));
        data = slice(data, 8, data.length - 8);

        // Check if there are transactions
        if (uint8(data[0]) == 0) {
            return Batch(hash, index, new bytes(0), new bytes[](0));
        }

        // Extract txHash
        require(data.length >= 64, "Invalid data length");
        bytes memory txHash = slice(data, 0, 64);
        data = slice(data, 64, data.length - 64);

        // Extract transactions
        bytes[] memory transactions;
        while (data.length > 0) {
            require(data.length >= 4, "Invalid data length");
            uint256 txLength = uint8ArrayToNumber(slice(data, 0, 4));
            data = slice(data, 4, data.length - 4);

            require(data.length >= txLength, "Invalid transaction length");
            bytes memory transaction = slice(data, 0, txLength);
            data = slice(data, txLength, data.length - txLength);

            transactions = appendTransaction(transactions, transaction);
        }

        return Batch(hash, index, txHash, transactions);
    }

    function slice(bytes memory data, uint256 start, uint256 length) internal pure returns (bytes memory) {
        require(data.length >= start + length, "Slice out of bounds");
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = data[start + i];
        }
        return result;
    }

    function uint8ArrayToBigInt(bytes memory data) internal pure returns (uint256) {
        require(data.length == 8, "Invalid uint8Array length");
        uint256 result;
        for (uint256 i = 0; i < 8; i++) {
            result = (result << 8) | uint8(data[i]);
        }
        return result;
    }

    function uint8ArrayToNumber(bytes memory data) internal pure returns (uint256) {
        require(data.length == 4, "Invalid uint8Array length");
        uint256 result;
        for (uint256 i = 0; i < 4; i++) {
            result = (result << 8) | uint8(data[i]);
        }
        return result;
    }

    function appendTransaction(bytes[] memory array, bytes memory item) internal pure returns (bytes[] memory) {
        bytes[] memory newArray = new bytes[](array.length + 1);
        for (uint256 i = 0; i < array.length; i++) {
            newArray[i] = array[i];
        }
        newArray[array.length] = item;
        return newArray;
    }
}
