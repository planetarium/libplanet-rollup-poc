// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { RuneSlotInfo } from "../utils/LibplanetCommonStructs.sol";
import "../TransactionParser.sol";

contract HackAndSlashParser is TransactionParser {
    struct HackAndSlash {
        bytes16 id;
        bytes16[] costumes;
        bytes16[] equipments;
        bytes16[] foods;
        RuneSlotInfo[] r;
        int64 worldId;
        int64 stageId;
        int64 stageBuffId; // -1 if null
        address avatarAddress;
        int64 totalPlayCount;
        int64 apStoneCount;
    }

    event HackAndSlashParsed(HackAndSlash hackAndSlash);

    function parseHackAndSlash(bytes memory input) public returns (HackAndSlash memory){
        (HackAndSlash memory h) = abi.decode(input, (HackAndSlash));
        emit HackAndSlashParsed(h);
        return h;
    }

    function parseHackAndSlashFromSerializedPayload(bytes memory input) public returns (HackAndSlash memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseHackAndSlash(t.actions[0].value);
    }
}