export const FaultDisputeGameFactoryAbi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "contract IFaultDisputeGame",
        "name": "faultDisputeGame",
        "type": "address"
      }
    ],
    "name": "FaultDisputeGameCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "Claim",
        "name": "_rootClaim",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "l2BlockNumber",
        "type": "uint256"
      }
    ],
    "name": "create",
    "outputs": [
      {
        "internalType": "contract IFaultDisputeGame",
        "name": "proxy_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "faultDisputeGameImplementation",
    "outputs": [
      {
        "internalType": "contract IFaultDisputeGame",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_index",
        "type": "uint256"
      }
    ],
    "name": "gameAtIndex",
    "outputs": [
      {
        "internalType": "Timestamp",
        "name": "timestamp_",
        "type": "uint64"
      },
      {
        "internalType": "contract IFaultDisputeGame",
        "name": "proxy_",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gameCount",
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
        "name": "_rootClaim",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "_l2BlockNumber",
        "type": "uint256"
      }
    ],
    "name": "games",
    "outputs": [
      {
        "internalType": "contract IFaultDisputeGame",
        "name": "proxy_",
        "type": "address"
      },
      {
        "internalType": "Timestamp",
        "name": "timestamp_",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IFaultDisputeGame",
        "name": "_faultDisputeGameImplementation",
        "type": "address"
      }
    ],
    "name": "setImplementation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;