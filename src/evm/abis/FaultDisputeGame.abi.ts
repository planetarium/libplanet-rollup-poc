export const FaultDisputeGameAbi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_maxGameDepth",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_splitDepth",
        "type": "uint256"
      },
      {
        "internalType": "Duration",
        "name": "_maxClockDuration",
        "type": "uint64"
      },
      {
        "internalType": "Duration",
        "name": "_clockExtension",
        "type": "uint64"
      },
      {
        "internalType": "contract IAnchorStateRegistry",
        "name": "_anchorStateRegistry",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyInitialized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AnchorRootNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CannotDefendRootClaim",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ClaimAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ClaimAlreadyResolved",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ClockNotExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ClockTimeExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameDepthExceeded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "GameNotInProgress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidClockExtension",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidDisputedClaimIndex",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidParent",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSplitDepth",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OutOfOrderResolution",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "Claim",
        "name": "rootClaim",
        "type": "bytes32"
      }
    ],
    "name": "UnexpectedRootClaim",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "parentIndex",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "Claim",
        "name": "claim",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "claimant",
        "type": "address"
      }
    ],
    "name": "Move",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "l2BlockNumber",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "Claim",
        "name": "rootClaim",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum GameStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "Resolved",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "anchorStateRegistry",
    "outputs": [
      {
        "internalType": "contract IAnchorStateRegistry",
        "name": "registry_",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "Claim",
        "name": "_disputed",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "_parentIndex",
        "type": "uint256"
      },
      {
        "internalType": "Claim",
        "name": "_claim",
        "type": "bytes32"
      }
    ],
    "name": "attack",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "claimData",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "parentIndex",
        "type": "uint32"
      },
      {
        "internalType": "address",
        "name": "counteredBy",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "claimant",
        "type": "address"
      },
      {
        "internalType": "uint128",
        "name": "bond",
        "type": "uint128"
      },
      {
        "internalType": "Claim",
        "name": "claim",
        "type": "bytes32"
      },
      {
        "internalType": "Position",
        "name": "position",
        "type": "uint128"
      },
      {
        "internalType": "Clock",
        "name": "clock",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimDataLen",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "len_",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "Hash",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "claims",
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
    "inputs": [],
    "name": "clockExtension",
    "outputs": [
      {
        "internalType": "Duration",
        "name": "clockExtension_",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "createdAt",
    "outputs": [
      {
        "internalType": "Timestamp",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "Claim",
        "name": "_disputed",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "_parentIndex",
        "type": "uint256"
      },
      {
        "internalType": "Claim",
        "name": "_claim",
        "type": "bytes32"
      }
    ],
    "name": "defend",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gameCreator",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator_",
        "type": "address"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gameData",
    "outputs": [
      {
        "internalType": "Claim",
        "name": "rootClaim_",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "l2BlockNumber_",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_claimIndex",
        "type": "uint256"
      }
    ],
    "name": "getChallengerDuration",
    "outputs": [
      {
        "internalType": "Duration",
        "name": "duration_",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_claimIndex",
        "type": "uint256"
      }
    ],
    "name": "getNumToResolve",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "numRemainingChildren_",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "l2BlockNumber",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "l2BlockNumber_",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxClockDuration",
    "outputs": [
      {
        "internalType": "Duration",
        "name": "maxClockDuration_",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxGameDepth",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "maxGameDepth_",
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
        "name": "_disputed",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "_challengeIndex",
        "type": "uint256"
      },
      {
        "internalType": "Claim",
        "name": "_claim",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "_isAttack",
        "type": "bool"
      }
    ],
    "name": "move",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "resolutionCheckpoints",
    "outputs": [
      {
        "internalType": "bool",
        "name": "initialCheckpointComplete",
        "type": "bool"
      },
      {
        "internalType": "uint32",
        "name": "subgameIndex",
        "type": "uint32"
      },
      {
        "internalType": "Position",
        "name": "leftmostPosition",
        "type": "uint128"
      },
      {
        "internalType": "address",
        "name": "counteredBy",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resolve",
    "outputs": [
      {
        "internalType": "enum GameStatus",
        "name": "status_",
        "type": "uint8"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_claimIndex",
        "type": "uint256"
      }
    ],
    "name": "resolveClaim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resolvedAt",
    "outputs": [
      {
        "internalType": "Timestamp",
        "name": "",
        "type": "uint64"
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
    "name": "resolvedSubgames",
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
    "inputs": [],
    "name": "rootClaim",
    "outputs": [
      {
        "internalType": "Claim",
        "name": "rootClaim_",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "splitDepth",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "splitDepth_",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startingBlockNumber",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "startingBlockNumber_",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startingOutputRoot",
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
    "name": "startingRootHash",
    "outputs": [
      {
        "internalType": "Hash",
        "name": "startingRootHash_",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "status",
    "outputs": [
      {
        "internalType": "enum GameStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_claimIndex",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isAttack",
        "type": "bool"
      }
    ],
    "name": "step",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "subgames",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;