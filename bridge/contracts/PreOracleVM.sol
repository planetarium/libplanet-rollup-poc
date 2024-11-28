// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import { IPreOracleVM } from "./interfaces/IPreOracleVM.sol";

import "solidity-rlp/contracts/RLPReader.sol";
import "./utils/ProvethVerifier.sol";

import "./utils/Types.sol";

contract PreOracleVM is IPreOracleVM {
  using RLPReader for RLPReader.RLPItem;
  using RLPReader for bytes;

  mapping(uint256 => bytes32) public blockHashes;
  uint256 public recentBlockNumber = 0;
  uint256 public fillCount = 0;

  mapping(bytes32 => bytes) public batchDatas;
  mapping(bytes32 => bool) public batchDataSubmitted;

  uint32 public constant BLOCKHASH_LIMIT = 200;
  uint256 public constant FRAME_PRE_INFO_SIZE = 22;
  uint256 public constant FRAME_POST_INFO_SIZE = 1;

  event BlockHashesFilled(uint256 indexed firstBlockNumber, uint256 indexed lastBlockNumber);

  function fillBlockHashes() external {
    uint256 currentBlockNumber = block.number - 1;

    uint256 firstBlockNumber = recentBlockNumber + 1;
    if(currentBlockNumber - BLOCKHASH_LIMIT > firstBlockNumber) {
      firstBlockNumber = currentBlockNumber - BLOCKHASH_LIMIT;
    }

    for(uint256 i = firstBlockNumber; i <= currentBlockNumber; i++) {
      blockHashes[i] = blockhash(i);
      recentBlockNumber = i;
    }

    emit BlockHashesFilled(firstBlockNumber, currentBlockNumber);
  }

  function submitBatchData(
    uint256 _blockNumber,
    bytes memory _rlpBlockHeader,
    bytes32 _txHash,
    bytes memory _rlpTxIndex,
    bytes memory _rlpTxProof
  ) external {
    bytes32 blockHash = blockHashes[_blockNumber];
    require(blockHash != bytes32(0), "Block hash not found");
    require(blockHash == keccak256(_rlpBlockHeader), "Invalid block header");

    RLPReader.RLPItem[] memory blockHeaderItems = _rlpBlockHeader.toRlpItem().toList();
    RLPReader.RLPItem memory transactionsRootItem = blockHeaderItems[4];
    bytes32 transactionsRoot = bytesToBytes32(transactionsRootItem.toBytes());

    RLPReader.RLPItem[] memory txProofItems = _rlpTxProof.toRlpItem().toList();
    require(transactionsRoot == keccak256(txProofItems[0].toRlpBytes()), "Invalid tx proof");

    bytes memory rlpTx = ProvethVerifier.validateMPTProof(
      transactionsRoot,
      ProvethVerifier.decodeNibbles(_rlpTxIndex, 0),
      txProofItems
    );
    require(_txHash == keccak256(rlpTx), "Invalid tx hash");

    RLPReader.RLPItem[] memory txItems = rlpTx.toRlpItem().toList();
    bytes memory batchData = txItems[5].toBytes();

    batchDatas[_txHash] = batchData;
    batchDataSubmitted[_txHash] = true;
  }

  function step(
    Claim _preStateClaim,
    uint256 _blockNumber,
    uint256 _transactionIndex,
    bytes memory _batchIndexData
  ) external view returns (Claim) {
    RLPReader.RLPItem[] memory batchIndexDataItems = _batchIndexData.toRlpItem().toList();
    uint256 blockNumber = batchIndexDataItems[0].toUint();
    require(blockNumber == _blockNumber, "Invalid block number");

    bytes32 startingTransactionHash = bytesToBytes32(batchIndexDataItems[1].toBytes());
    uint256 startingDataIndex = batchIndexDataItems[2].toUint();
    bytes32 endingTransactionHash = bytesToBytes32(batchIndexDataItems[3].toBytes());
    uint256 endingDataIndex = batchIndexDataItems[4].toUint();

    bytes memory startingBatchData = batchDatas[startingTransactionHash];
    require(startingBatchData.length > 0, "Starting batch data not found");
    if(endingTransactionHash != startingTransactionHash) {
      bytes memory endingBatchData = batchDatas[endingTransactionHash];
      require(endingBatchData.length > 0, "Ending batch data not found");
    }

    return _preStateClaim;
  }

  function bytesToBytes32(bytes memory data) internal pure returns (bytes32) {
    require(data.length == 32, "Invalid data length");
    bytes32 result;
    assembly {
      result := mload(add(data, 32))
    }
    return result;
  }
}