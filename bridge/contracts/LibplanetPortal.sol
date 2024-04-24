// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract LibplanetPortal {

    event DepositETH(address from, address to, uint256 amount);
    event WithdrawETH(address from, address to, uint256 amount);

    function depositETH(
        address from,
        address to,
        uint256 amount
    ) public payable {
        emit DepositETH(from, to, amount);
    }

    function withdrawETH(
        address from,
        address to,
        uint256 amount
    ) public {
        emit WithdrawETH(from, to, amount);
    }
}