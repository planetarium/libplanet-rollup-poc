export const abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_proposer",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "outputRoot",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "l2OutputIndex",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "l2BlockNumber",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "l1Timestamp",
        "type": "uint256"
      }
    ],
    "name": "OutputProposed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "PROPOSER",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestBlockNumber",
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
    "name": "nextOutputIndex",
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
        "name": "_outputRoot",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "_l2BlockNumber",
        "type": "uint256"
      }
    ],
    "name": "proposeL2Output",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;