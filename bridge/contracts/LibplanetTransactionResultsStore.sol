// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract LibplanetTransactionResultsStore {
    enum TxStatus {
        INVALID,
        STAGING,
        SUCCESS,
        FAILURE,
        INCLUDED
    }

    struct TransactionResult {
        TxStatus txStatus;
        bytes32 blockHash;
        bytes32 inputState;
        bytes32 outputState;
    }

    mapping(bytes32 => bool) storeCheck;

    event TxResultStored(uint256 indexed blockIndex, TransactionResult txResult);

    function storeTxResult(uint256 blockIndex, bytes32 txId, TransactionResult memory txResult) public {
        if(!storeCheck[txId]){
            emit TxResultStored(blockIndex, txResult);
            storeCheck[txId] = true;
        }
    }
}