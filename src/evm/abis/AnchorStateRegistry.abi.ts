export const AnchorStateRegistryAbi = [
  {
    "inputs": [
      {
        "internalType": "contract IFaultDisputeGameFactory",
        "name": "_faultDisputeGameFactory",
        "type": "address"
      },
      {
        "components": [
          {
            "internalType": "Hash",
            "name": "root",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "l2BlockNumber",
            "type": "uint256"
          }
        ],
        "internalType": "struct OutputRoot",
        "name": "_startingOutputRoot",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "anchor",
    "outputs": [
      {
        "internalType": "Hash",
        "name": "root",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "l2BlockNumber",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "faultDisputeGameFactory",
    "outputs": [
      {
        "internalType": "contract IFaultDisputeGameFactory",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAnchor",
    "outputs": [
      {
        "components": [
          {
            "internalType": "Hash",
            "name": "root",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "l2BlockNumber",
            "type": "uint256"
          }
        ],
        "internalType": "struct OutputRoot",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tryUpdateAnchorState",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;