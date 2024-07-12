// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../TransactionParser.sol";

contract AuraSummonParser is TransactionParser {
    struct AuraSummon {
        bytes16 id;
        address aa;
        int64 gid;
        int64 sc;
    }

    event AuraSummonParsed(AuraSummon auraSummon);

    function parseAuraSummon(bytes memory input) public returns (AuraSummon memory){
        (AuraSummon memory output) = abi.decode(input, (AuraSummon));
        emit AuraSummonParsed(output);
        return output;
    }

    function parseAuraSummonFromSerializedPayload(bytes memory input) public returns (AuraSummon memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseAuraSummon(t.actions[0].value);
    }
}