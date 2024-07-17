// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { FungibleAssetValue } from "../utils/LibplanetCommonStructs.sol";
import "../TransactionParser.sol";

contract TransferAssetParser is TransactionParser {
    struct TransferAsset {
        address sender;
        address recipient;
        FungibleAssetValue amount;
        string memo; // "" if null
    }

    event TransferAssetParsed(TransferAsset transferAsset);

    function parseTransferAsset(bytes memory input) public returns (TransferAsset memory){
        (TransferAsset memory output) = abi.decode(input, (TransferAsset));
        emit TransferAssetParsed(output);
        return output;
    }

    function parseTransferAssetFromSerializedPayload(bytes memory input) public returns (TransferAsset memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseTransferAsset(t.actions[0].value);
    }
}
