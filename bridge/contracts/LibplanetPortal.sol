// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { LibplanetOutputOracle } from "./LibplanetOutputOracle.sol";
import { Types } from "./utils/LibplanetTypes.sol";

contract LibplanetPortal {

    LibplanetOutputOracle public L2_ORACLE;

    mapping(address => bool) public provenWithdrawals;

    event DepositETH(address from, address to, uint256 amount);
    event WithdrawNCG(address from, address to, uint256 amount);
    event WithdrawETH(address from, address to, uint256 amount);

    event WithdrawalProven(
        address indexed withdrawalHash,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    constructor(
        LibplanetOutputOracle _l2Oracle
    ) {
        L2_ORACLE = _l2Oracle;
    }

    function depositETH(
        address from,
        address to,
        uint256 amount
    ) public payable {
        //Doesn't it need to check msg.value?
        emit DepositETH(from, to, amount);
    }

    function withdrawNCG(
        address to,
        uint256 amount
    ) public {
        emit WithdrawNCG(msg.sender, to, amount);
    }

    function withdrawETH(
        address from,
        address to,
        uint256 amount
    ) public {
        emit WithdrawETH(from, to, amount);
    }

    function proveWithdrawalTransaction(
        Types.WithdrawalTransaction calldata _tx,
        uint256 _l2OutputIndex,
        Types.OutputRootProof memory _proof,
        bytes calldata _withdrawalProof
    ) external {
        bytes32 outputRoot = L2_ORACLE.getL2Output(_l2OutputIndex).outputRoot;
        require(hashOutputRootProof(_proof) == outputRoot, "Invalid output root proof");
        address withdrawalHash = _callLibplanetWithdrawalTransactionHashing(_tx);
        require(provenWithdrawals[withdrawalHash] == false, "Already proven");
        provenWithdrawals[withdrawalHash] = true;
        require(_callLibplanetVerifyProof(
            abi.encodePacked(_proof.stateRoot),
            _withdrawalProof,
            abi.encodePacked(withdrawalHash),
            hex"74" // bencoded(true) = 0x74
        ),
            "Invalid withdrawal proof"
        );

        emit WithdrawalProven(withdrawalHash, _tx.from, _tx.to, _tx.amount);
    }

    function hashOutputRootProof(
        Types.OutputRootProof memory _proof
    ) private pure returns (bytes32) {
        uint256 hashUint = uint256(_proof.stateRoot) | uint256(_proof.storageRoot);
        bytes32 hashBytes = bytes32(hashUint);
        return sha256(abi.encodePacked(hashBytes));
    }

    function _callLibplanetWithdrawalTransactionHashing(
        Types.WithdrawalTransaction memory _tx
    ) private view returns (address) {
        address _addr = 0x0000000000000000000000000000000000000201;
        (bool ok, bytes memory out) = _addr.staticcall(abi.encode(_tx));
        require(ok, "withdrawal transaction hashing failed");
        return abi.decode(out, (address));
    }

    function _callLibplanetVerifyProof(
        bytes memory stateRootHash,
        bytes memory proof,
        bytes memory key,
        bytes memory value
    ) private view returns (bool) {
        address _addr = 0x0000000000000000000000000000000000000200;
        (bool ok, bytes memory out) = _addr.staticcall(abi.encode(stateRootHash, proof, key, value));
        require(ok, "proof verification error");
        return abi.decode(out, (bool));
    }
}
