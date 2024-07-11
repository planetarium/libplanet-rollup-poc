// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { Transaction, RuneSlotInfo } from "../LibplanetCommonStructs.sol";

contract HackAndSlashParser {
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

    function transactionDeserializer(bytes memory input) public view returns (bool ok, bytes memory out) {
        address _addr = 0x0000000000000000000000000000000000000101;
        return _addr.staticcall(input);
    }

    function parseHackAndSlash(bytes memory input) public returns (HackAndSlash memory){
        (HackAndSlash memory t) = abi.decode(input, (HackAndSlash));
        emit HackAndSlashParsed(t);
        return t;
    }

    function parseHackAndSlashFromSerializedPayload(bytes memory input) public returns (HackAndSlash memory){
        (bool ok, bytes memory out) = transactionDeserializer(input);
        require(ok, "HackAndSlash deserialization failed");
        return parseHackAndSlash(out);
    }
}