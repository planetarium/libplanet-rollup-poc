// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { LibClone } from "./utils/LibClone.sol";

import { IFaultDisputeGameFactory } from "./interfaces/IFaultDisputeGameFactory.sol";

import { IFaultDisputeGame } from "./interfaces/IFaultDisputeGame.sol";

import "./utils/Types.sol";

contract FaultDisputeGameFactory is IFaultDisputeGameFactory {
    using LibClone for address;

    IFaultDisputeGame public faultDisputeGameImplementation;

    mapping(Hash => GameId) internal _faultDisputeGames;

    GameId[] internal _faultDisputeGameIds;

    event FaultDisputeGameCreated(IFaultDisputeGame faultDisputeGame);

    function gameCount() external view returns (uint256) {
        return _faultDisputeGameIds.length;
    }

    function games(Claim _rootClaim, uint256 _l2BlockNumber) external view returns (IFaultDisputeGame proxy_, Timestamp timestamp_) {
        Hash uuid = getGameUUID(_rootClaim, _l2BlockNumber);
        (Timestamp timestamp, address proxy) = _faultDisputeGames[uuid].unpack();
        (proxy_, timestamp_) = (IFaultDisputeGame(proxy), timestamp);
    }

    function gameAtIndex(uint256 _index) external view returns (Timestamp timestamp_, IFaultDisputeGame proxy_) {
        (Timestamp timestamp, address proxy) = _faultDisputeGameIds[_index].unpack();
        (timestamp_, proxy_) = (timestamp, IFaultDisputeGame(proxy));
    }

    function create(Claim _rootClaim, uint256 l2BlockNumber) external returns (IFaultDisputeGame proxy_) {
        if (address(faultDisputeGameImplementation) == address(0)) {
            revert("FaultDisputeGameFactory: implementation not set");
        }

        bytes32 parentHash = blockhash(block.number - 1);

        proxy_ = IFaultDisputeGame(address(faultDisputeGameImplementation).clone(
            abi.encodePacked(msg.sender, _rootClaim, parentHash, l2BlockNumber)
        ));
        proxy_.initialize();

        Hash uuid = getGameUUID(_rootClaim, l2BlockNumber);

        if (GameId.unwrap(_faultDisputeGames[uuid]) != bytes32(0)) {
            revert ("FaultDisputeGameFactory: game already exists");
        }

        GameId id = LibGameId.pack(Timestamp.wrap(uint64(block.timestamp)), address(proxy_));

        _faultDisputeGames[uuid] = id;
        _faultDisputeGameIds.push(id);

        emit FaultDisputeGameCreated(proxy_);
    }

    function getGameUUID(
        Claim _rootClaim,
        uint256 _l2BlockNumber
    )
        private
        pure
        returns (Hash uuid_)
    {
        uuid_ = Hash.wrap(keccak256(abi.encode(_rootClaim, _l2BlockNumber)));
    }

    function setImplementation(IFaultDisputeGame _faultDisputeGameImplementation) public {
        faultDisputeGameImplementation = _faultDisputeGameImplementation;
    }
}