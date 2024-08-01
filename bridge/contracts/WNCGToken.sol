// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WNCGToken is ERC20 {
    constructor() ERC20("WNCGToken", "WNCG") {
        _mint(msg.sender, 100000000);
    }

    function decimals() public pure override returns (uint8) {
        return 2;
    }
}