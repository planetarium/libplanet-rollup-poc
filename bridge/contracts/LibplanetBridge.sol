// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { LibplanetPortal } from "./LibplanetPortal.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

    // not tested
    function withdrawNCG(
        address _l1token,
        address to,
        uint256 amount
    ) public {
        IERC20 l1token = IERC20(_l1token);
        require(l1token.balanceOf(address(this)) >= amount, "Insufficient balance");
        l1token.transfer(address(this), amount);
        PORTAL.withdrawNCG(to, amount);
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
