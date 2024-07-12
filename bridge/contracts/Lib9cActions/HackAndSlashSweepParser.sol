// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { RuneSlotInfo } from "../utils/LibplanetCommonStructs.sol";
import "../TransactionParser.sol";

contract HackAndSlashSweepParser is TransactionParser {
    struct HackAndSlashSweep {
        bytes16 id;
        bytes16[] costumes;
        bytes16[] equipments;
        RuneSlotInfo[] runeInfos;
        address avatarAddress;
        int64 apStoneCount;
        int64 actionPoint;
        int64 worldId;
        int64 stageId;
    }

    event HackAndSlashSweepParsed(HackAndSlashSweep hackAndSlashSweep);

    function parseHackAndSlashSweep(bytes memory input) public returns (HackAndSlashSweep memory){
        (HackAndSlashSweep memory output) = abi.decode(input, (HackAndSlashSweep));
        emit HackAndSlashSweepParsed(output);
        return output;
    }

    function parseHackAndSlashSweepFromSerializedPayload(bytes memory input) public returns (HackAndSlashSweep memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseHackAndSlashSweep(t.actions[0].value);
    }
}