export const LibplanetPortalAbi = [
  {
    "inputs": [
      {
        "internalType": "contract IFaultDisputeGameFactory",
        "name": "_faultDisputeGameFactory",
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
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "EthDeposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes20",
        "name": "withdrawalHash",
        "type": "bytes20"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "success",
        "type": "bool"
      }
    ],
    "name": "WithdrawalFinalized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes20",
        "name": "withdrawalHash",
        "type": "bytes20"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "proofSubmitter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "gameIndex",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "WithdrawalProven",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "depositETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "internalType": "struct WithdrawalTransaction",
        "name": "_tx",
        "type": "tuple"
      },
      {
        "internalType": "address",
        "name": "_proofSubmitter",
        "type": "address"
      }
    ],
    "name": "finalizeWithdrawalTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes20",
        "name": "",
        "type": "bytes20"
      }
    ],
    "name": "finalizedWithdrawals",
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
        "components": [
          {
            "internalType": "uint256",
            "name": "nonce",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "internalType": "struct WithdrawalTransaction",
        "name": "_tx",
        "type": "tuple"
      },
      {
        "internalType": "uint256",
        "name": "_disputeGameIndex",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "stateRoot",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "storageRoot",
            "type": "bytes32"
          }
        ],
        "internalType": "struct OutputRootProof",
        "name": "_proof",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "_withdrawalProof",
        "type": "bytes"
      }
    ],
    "name": "proveWithdrawalTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes20",
        "name": "",
        "type": "bytes20"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "provenWithdrawals",
    "outputs": [
      {
        "internalType": "contract IFaultDisputeGame",
        "name": "disputeGameProxy",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "timestamp",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;