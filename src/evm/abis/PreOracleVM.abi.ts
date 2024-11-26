export const PreOracleVMAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "firstBlockNumber",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "lastBlockNumber",
        "type": "uint256"
      }
    ],
    "name": "BlockHashesFilled",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BLOCKHASH_LIMIT",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FRAME_POST_INFO_SIZE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FRAME_PRE_INFO_SIZE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "batchDataSubmitted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "batchDatas",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "blockHashes",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fillBlockHashes",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fillCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "recentBlockNumber",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "Claim",
        "name": "_preStateClaim",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "_blockNumber",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_transactionIndex",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "_batchIndexData",
        "type": "bytes"
      }
    ],
    "name": "step",
    "outputs": [
      {
        "internalType": "Claim",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_blockNumber",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "_rlpBlockHeader",
        "type": "bytes"
      },
      {
        "internalType": "bytes32",
        "name": "_txHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "_rlpTxIndex",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "_rlpTxProof",
        "type": "bytes"
      }
    ],
    "name": "submitBatchData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;