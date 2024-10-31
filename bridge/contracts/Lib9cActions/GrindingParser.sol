// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../TransactionParser.sol";

contract GrindingParser is TransactionParser {
    struct Grinding {
        bytes16 id;
        address a;
        bytes16[] e;
        bool c;
    }

    event GrindingParsed(Grinding grinding);

    function parseGrinding(bytes memory input) public returns (Grinding memory){
        (Grinding memory output) = abi.decode(input, (Grinding));
        emit GrindingParsed(output);
        return output;
    }

    function parseGrindingFromSerializedPayload(bytes memory input) public returns (Grinding memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseGrinding(t.actions[0].value);
    }
}
