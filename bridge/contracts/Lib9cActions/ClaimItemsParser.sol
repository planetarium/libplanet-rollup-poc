// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { FungibleAssetValue } from "../utils/LibplanetCommonStructs.sol";
import "../TransactionParser.sol";

contract ClaimItemsParser is TransactionParser {
    struct ClaimItems {
        bytes16 id;
        ClaimData[] cd;
        string m; // "" if null
    }

    struct ClaimData {
        address avatarAddress;
        FungibleAssetValue[] fungibleAssetValues;
    }

    event ClaimItemsParsed(ClaimItems claimItems);

    function parseClaimItems(bytes memory input) public returns (ClaimItems memory){
        (ClaimItems memory output) = abi.decode(input, (ClaimItems));
        emit ClaimItemsParsed(output);
        return output;
    }

    function parseClaimItemsFromSerializedPayload(bytes memory input) public returns (ClaimItems memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseClaimItems(t.actions[0].value);
    }
}