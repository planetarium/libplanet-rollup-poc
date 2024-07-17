// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../TransactionParser.sol";

contract CombinationEquipmentParser is TransactionParser {
    struct CombinationEquipment {
        bytes16 id;
        address a;
        int64 s;
        int64 r;
        int64 i; // -1 if null
        bool p;
        bool h;
        int64 pid; // -1 if null
    }

    event CombinationEquipmentParsed(CombinationEquipment combinationEquipment);

    function parseCombinationEquipment(bytes memory input) public returns (CombinationEquipment memory){
        (CombinationEquipment memory output) = abi.decode(input, (CombinationEquipment));
        emit CombinationEquipmentParsed(output);
        return output;
    }

    function parseCombinationEquipmentFromSerializedPayload(bytes memory input) public returns (CombinationEquipment memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseCombinationEquipment(t.actions[0].value);
    }
}
