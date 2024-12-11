// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { IFaultDisputeGameFactory } from "./interfaces/IFaultDisputeGameFactory.sol";
import { IFaultDisputeGame } from "./interfaces/IFaultDisputeGame.sol";

import "./utils/Types.sol";

contract LibplanetPortal {
    struct ProvenWithdrawal {
        IFaultDisputeGame disputeGameProxy;
        uint64 timestamp;
    }

    IFaultDisputeGameFactory internal immutable FAULT_DISPUTE_GAME_FACTORY;

    mapping(bytes20 => mapping(address => ProvenWithdrawal)) public provenWithdrawals;
    mapping(bytes20 => bool) public finalizedWithdrawals;

    event EthDeposited(
        address indexed from, 
        address indexed to, 
        uint256 indexed amount);

    event WithdrawalProven(
        bytes20 indexed withdrawalHash,
        address proofSubmitter,
        uint256 gameIndex,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event WithdrawalFinalized(
        bytes20 indexed withdrawalHash,
        bool success
    );

    constructor(
        IFaultDisputeGameFactory _faultDisputeGameFactory
    ) {
        FAULT_DISPUTE_GAME_FACTORY = _faultDisputeGameFactory;
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
        WithdrawalTransaction memory _tx,
        uint256 _disputeGameIndex,
        OutputRootProof memory _proof,
        bytes memory _withdrawalProof
    ) external {
        IFaultDisputeGame gameProxy;
        try FAULT_DISPUTE_GAME_FACTORY.gameAtIndex(_disputeGameIndex) returns (Timestamp timestamp_, IFaultDisputeGame proxy_) {
            gameProxy = proxy_;
        } catch Error(string memory reason) {
            revert(reason);
        }
        require(gameProxy != IFaultDisputeGame(address(0)), "Invalid dispute game index");
        Claim outputRoot = gameProxy.rootClaim();
        require(outputRoot.raw() != bytes32(0), "Invalid output root");
        require(hashOutputRootProof(_proof) == outputRoot.raw(), "Invalid output root proof");
        
        bytes20 withdrawalHash = _callLibplanetWithdrawalTransactionHashing(_tx);
        require(withdrawalHash != bytes20(0), "Invalid withdrawal transaction");
        require(gameProxy != provenWithdrawals[withdrawalHash][msg.sender].disputeGameProxy, "Already proven");

        require(gameProxy.status() != GameStatus.CHALLENGER_WINS, "cannot prove against invalid dispute games");

        require(_callLibplanetVerifyProof(
            abi.encodePacked(_proof.storageRoot),
            _withdrawalProof,
            abi.encodePacked(withdrawalHash),
            hex"74" // bencoded(true) = 0x74
            ),
            "Invalid withdrawal proof"
        );
        
        provenWithdrawals[withdrawalHash][msg.sender] = ProvenWithdrawal(gameProxy, uint64(block.timestamp));

        emit WithdrawalProven(withdrawalHash, msg.sender, _disputeGameIndex, _tx.from, _tx.to, _tx.amount);
    }

    function finalizeWithdrawalTransaction(
        WithdrawalTransaction memory _tx,
        address _proofSubmitter
    ) external {
        bytes20 withdrawalHash = _callLibplanetWithdrawalTransactionHashing(_tx);
        require(isProvenWithdrawalInitialized(withdrawalHash, _proofSubmitter), "Not proven yet");

        IFaultDisputeGame gameProxy = provenWithdrawals[withdrawalHash][_proofSubmitter].disputeGameProxy;
        require(gameProxy.status() != GameStatus.CHALLENGER_WINS, "cannot finalize against invalid dispute games");
        require(gameProxy.status() == GameStatus.DEFENDER_WINS, "cannot finalize against in-progress dispute games");

        require(finalizedWithdrawals[withdrawalHash] == false, "Already finalized");

        bool success = payable(_tx.to).send(_tx.amount);

        finalizedWithdrawals[withdrawalHash] = success;

        emit WithdrawalFinalized(withdrawalHash, success);
    }

    function hashOutputRootProof(
        OutputRootProof memory _proof
    ) internal pure returns (bytes32) {
        require(_proof.stateRoot != bytes32(0), "Invalid state root");
        require(_proof.storageRoot != bytes32(0), "Invalid storage root");
        return sha256(abi.encodePacked(_proof.stateRoot, _proof.storageRoot));
    }

    function isProvenWithdrawalInitialized(
        bytes20 _withdrawalHash,
        address _proofSubmitter
    ) internal view returns (bool) {
        return provenWithdrawals[_withdrawalHash][_proofSubmitter].disputeGameProxy != IFaultDisputeGame(address(0)) &&
            provenWithdrawals[_withdrawalHash][_proofSubmitter].timestamp != 0;
    }

    function _callLibplanetWithdrawalTransactionHashing(
        WithdrawalTransaction memory _tx
    ) internal view returns (bytes20) {
        address addr = 0x0000000000000000000000000000000000000201;
        (bool ok, bytes memory out) = addr.staticcall(abi.encode(
            _tx.nonce,
            _tx.from,
            _tx.to,
            _tx.amount
        ));
        require(ok, "withdrawal transaction hashing failed");
        address res = abi.decode(out, (address));
        return bytes20(res);
    }

    function _callLibplanetVerifyProof(
        bytes memory _stateRootHash,
        bytes memory _proof,
        bytes memory _key,
        bytes memory _value
    ) internal view returns (bool) {
        address addr = 0x0000000000000000000000000000000000000200;
        (bool ok, bytes memory out) = addr.staticcall(abi.encode(_stateRootHash, _proof, _key, _value));
        require(ok, "proof verification error");
        return abi.decode(out, (bool));
    }
}
