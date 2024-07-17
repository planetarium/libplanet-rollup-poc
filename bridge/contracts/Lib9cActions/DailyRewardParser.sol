// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "../TransactionParser.sol";

contract DailyRewardParser is TransactionParser {
    struct DailyReward {
        bytes16 id;
        address a;
    }

    event DailyRewardParsed(DailyReward dailyReward);

    function parseDailyReward(bytes memory input) public returns (DailyReward memory){
        (DailyReward memory output) = abi.decode(input, (DailyReward));
        emit DailyRewardParsed(output);
        return output;
    }

    function parseDailyRewardFromSerializedPayload(bytes memory input) public returns (DailyReward memory){
        (Transaction memory t) = parseTransactionFromSerializedPayload(input);
        require(t.actions.length > 0, "Action is empty");
        return parseDailyReward(t.actions[0].value);
    }
}
