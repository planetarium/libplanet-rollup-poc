// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { LibplanetBridge } from "./LibplanetBridge.sol";

contract LibplanetCrossChainMessenger {
    LibplanetBridge public immutable BRIDGE;

    constructor(LibplanetBridge bridge) {
        BRIDGE = bridge;
    }

    function withdrawETH(
        address from,
        address to,
        uint256 amount
    ) public {
        BRIDGE.withdrawETH(from, to, amount);
    }
}
