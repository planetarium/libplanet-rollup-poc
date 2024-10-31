// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../TransactionParser.sol";

contract RapidCombinationParser is TransactionParser {
    struct RapidCombination {
        bytes16 id;
        address avatarAddress;
        int64 slotIndex;
    }

    event RapidCombinationParsed(RapidCombination rapidCombination);

    function parseRapidCombination(bytes memory input) public returns (RapidCombination memory){
        (RapidCombination memory output) = abi.decode(input, (RapidCombination));
        emit RapidCombinationParsed(output);
        return output;
    }

    function parseRapidCombinationFromSerializedPayload(bytes memory input) public returns (RapidCombination memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseRapidCombination(t.actions[0].value);
    }
}
