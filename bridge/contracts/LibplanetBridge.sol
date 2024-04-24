// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { LibplanetPortal } from "./LibplanetPortal.sol";

contract LibplanetBridge {

    LibplanetPortal public immutable PORTAL;

    constructor(LibplanetPortal portal) {
        PORTAL = portal;
    }

    function depositETH(
        address from,
        address to,
        uint256 amount
    ) public payable {
        require(msg.value == amount, "Invalid amount");
        PORTAL.depositETH{value: msg.value}(from, to, amount);
    }

    function withdrawETH(
        address from,
        address to,
        uint256 amount
    ) public {
        payable(to).transfer(amount);
        PORTAL.withdrawETH(from, to, amount);
    }
}
