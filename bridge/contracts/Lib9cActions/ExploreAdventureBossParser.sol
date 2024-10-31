// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { RuneSlotInfo } from "../utils/LibplanetCommonStructs.sol";
import "../TransactionParser.sol";

contract ExploreAdventureBossParser is TransactionParser {
    struct ExploreAdventureBoss {
        bytes16 id;
        int64 season;
        address avatarAddress;
        bytes16[] costumes;
        bytes16[] equipments;
        bytes16[] foods;
        RuneSlotInfo[] r;
        int64 stageBuffId; // -1 if null
    }

    event ExploreAdventureBossParsed(ExploreAdventureBoss exploreAdventureBoss);

    function parseExploreAdventureBoss(bytes memory input) public returns (ExploreAdventureBoss memory){
        (ExploreAdventureBoss memory output) = abi.decode(input, (ExploreAdventureBoss));
        emit ExploreAdventureBossParsed(output);
        return output;
    }

    function parseExploreAdventureBossFromSerializedPayload(bytes memory input) public returns (ExploreAdventureBoss memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseExploreAdventureBoss(t.actions[0].value);
    }
}
