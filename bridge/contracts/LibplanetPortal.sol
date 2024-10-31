// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { LibplanetOutputOracle } from "./LibplanetOutputOracle.sol";
import { Types } from "./utils/LibplanetTypes.sol";

contract LibplanetPortal {

    LibplanetOutputOracle public L2_ORACLE;

    mapping(address => bool) public provenWithdrawals;
    mapping(address => bool) public finalizedWithdrawals;

    event EthDeposited(
        address indexed from, 
        address indexed to, 
        uint256 indexed amount);

    event WithdrawalProven(
        address indexed withdrawalHash,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event WithdrawalFinalized(
        address indexed withdrawalHash,
        bool success
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
        require(msg.value == amount, "Invalid amount");
        emit EthDeposited(from, to, amount);
    }

    function proveWithdrawalTransaction(
        Types.WithdrawalTransaction memory _tx,
        uint256 _l2OutputIndex,
        Types.OutputRootProof memory _proof,
        bytes memory _withdrawalProof
    ) external {
        bytes32 outputRoot = L2_ORACLE.getL2Output(_l2OutputIndex).outputRoot;
        require(hashOutputRootProof(_proof) == outputRoot, "Invalid output root proof");
        
        address withdrawalHash = _callLibplanetWithdrawalTransactionHashing(_tx);
        require(provenWithdrawals[withdrawalHash] == false, "Already proven");

        require(_callLibplanetVerifyProof(
            abi.encodePacked(_proof.storageRoot),
            _withdrawalProof,
            abi.encodePacked(withdrawalHash),
            hex"74" // bencoded(true) = 0x74
            ),
            "Invalid withdrawal proof"
        );
        
        provenWithdrawals[withdrawalHash] = true;

        emit WithdrawalProven(withdrawalHash, _tx.from, _tx.to, _tx.amount);
    }

    function finalizeWithdrawalTransaction(
        Types.WithdrawalTransaction memory _tx
    ) external {
        address withdrawalHash = _callLibplanetWithdrawalTransactionHashing(_tx);
        require(provenWithdrawals[withdrawalHash] == true, "Not proven yet");
        require(finalizedWithdrawals[withdrawalHash] == false, "Already finalized");

        bool success = payable(_tx.to).send(_tx.amount);

        finalizedWithdrawals[withdrawalHash] = success;

        emit WithdrawalFinalized(withdrawalHash, success);
    }

    function hashOutputRootProof(
        Types.OutputRootProof memory _proof
    ) private pure returns (bytes32) {
        return sha256(abi.encodePacked(_proof.stateRoot, _proof.storageRoot));
    }

    function _callLibplanetWithdrawalTransactionHashing(
        Types.WithdrawalTransaction memory _tx
    ) private view returns (address) {
        address _addr = 0x0000000000000000000000000000000000000201;
        (bool ok, bytes memory out) = _addr.staticcall(abi.encode(
            _tx.nonce,
            _tx.from,
            _tx.to,
            _tx.amount
        ));
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
