// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import "solidity-rlp/contracts/RLPReader.sol";
import "./utils/ProvethVerifier.sol";

contract PreOracleVM {
  using RLPReader for RLPReader.RLPItem;
  using RLPReader for bytes;

  mapping(uint256 => bytes32) public blockHashes;
  uint256 public recentBlockNumber = 0;

  mapping(bytes32 => bytes) public batchDatas;
  mapping(bytes32 => bool) public batchDataSubmitted;

  function fillBlockHashs() external {
    uint256 currentBlockNumber = block.number;
    uint256 firstBlockNumber = recentBlockNumber + 1;
    if(currentBlockNumber - 255 > firstBlockNumber) {
      firstBlockNumber = currentBlockNumber - 255;
    }

    for(uint256 i = firstBlockNumber; i <= currentBlockNumber; i++) {
      blockHashes[i] = blockhash(i);
      recentBlockNumber = i;
    }
  }

  function submitBatchData(
    uint256 _blockNumber,
    bytes memory _rlpBlockHeader,
    bytes32 _txHash,
    bytes memory _rlpTxIndex,
    bytes memory _rlpTxProof
  ) external {
    bytes32 blockHash = blockHashes[_blockNumber];
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

  function bytesToBytes32(bytes memory data) internal pure returns (bytes32) {
    require(data.length == 32, "Invalid data length");
    bytes32 result;
    assembly {
      result := mload(add(data, 32))
    }
    return result;
  }
}