// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { LibplanetPortal } from "./LibplanetPortal.sol";

contract LibplanetBridge {

    LibplanetPortal public immutable PORTAL;

    constructor(LibplanetPortal portal) {
        PORTAL = portal;
    }

    function depositETH(
        address _from,
        address _to,
        uint256 _amount
    ) public payable {
        require(msg.value == _amount, "Invalid amount");
        PORTAL.depositETH{value: msg.value}(_from, _to, _amount);
    }
}
