export const abi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes16",
            "name": "id",
            "type": "bytes16"
          },
          {
            "internalType": "bytes16[]",
            "name": "costumes",
            "type": "bytes16[]"
          },
          {
            "internalType": "bytes16[]",
            "name": "equipments",
            "type": "bytes16[]"
          },
          {
            "internalType": "bytes16[]",
            "name": "foods",
            "type": "bytes16[]"
          },
          {
            "components": [
              {
                "internalType": "int64",
                "name": "slotIndex",
                "type": "int64"
              },
              {
                "internalType": "int64",
                "name": "runeId",
                "type": "int64"
              }
            ],
            "internalType": "struct RuneSlotInfo[]",
            "name": "r",
            "type": "tuple[]"
          },
          {
            "internalType": "int64",
            "name": "worldId",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "stageId",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "stageBuffId",
            "type": "int64"
          },
          {
            "internalType": "address",
            "name": "avatarAddress",
            "type": "address"
          },
          {
            "internalType": "int64",
            "name": "totalPlayCount",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "apStoneCount",
            "type": "int64"
          }
        ],
        "indexed": false,
        "internalType": "struct HackAndSlashParser.HackAndSlash",
        "name": "hackAndSlash",
        "type": "tuple"
      }
    ],
    "name": "HackAndSlashParsed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "typeId",
                "type": "string"
              },
              {
                "internalType": "bytes",
                "name": "value",
                "type": "bytes"
              }
            ],
            "internalType": "struct TransactionParser.Action[]",
            "name": "actions",
            "type": "tuple[]"
          },
          {
            "internalType": "bytes32",
            "name": "genesisHash",
            "type": "bytes32"
          },
          {
            "internalType": "int64",
            "name": "gasLimit",
            "type": "int64"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "uint8",
                    "name": "decimalPlaces",
                    "type": "uint8"
                  },
                  {
                    "internalType": "address[]",
                    "name": "minters",
                    "type": "address[]"
                  },
                  {
                    "internalType": "string",
                    "name": "ticker",
                    "type": "string"
                  },
                  {
                    "internalType": "bool",
                    "name": "totalSupplyTrackable",
                    "type": "bool"
                  },
                  {
                    "internalType": "uint256",
                    "name": "maximumSupplyMajor",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "maximumSupplyMinor",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct Currency",
                "name": "currency",
                "type": "tuple"
              },
              {
                "internalType": "uint256",
                "name": "rawValue",
                "type": "uint256"
              }
            ],
            "internalType": "struct FungibleAssetValue",
            "name": "maxGasPrice",
            "type": "tuple"
          },
          {
            "internalType": "int64",
            "name": "nonce",
            "type": "int64"
          },
          {
            "internalType": "bytes",
            "name": "publicKey",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "signer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "updatedAddresses",
            "type": "address[]"
          }
        ],
        "indexed": false,
        "internalType": "struct TransactionParser.Transaction",
        "name": "transaction",
        "type": "tuple"
      }
    ],
    "name": "TransactionParsed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "input",
        "type": "bytes"
      }
    ],
    "name": "parseHackAndSlash",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes16",
            "name": "id",
            "type": "bytes16"
          },
          {
            "internalType": "bytes16[]",
            "name": "costumes",
            "type": "bytes16[]"
          },
          {
            "internalType": "bytes16[]",
            "name": "equipments",
            "type": "bytes16[]"
          },
          {
            "internalType": "bytes16[]",
            "name": "foods",
            "type": "bytes16[]"
          },
          {
            "components": [
              {
                "internalType": "int64",
                "name": "slotIndex",
                "type": "int64"
              },
              {
                "internalType": "int64",
                "name": "runeId",
                "type": "int64"
              }
            ],
            "internalType": "struct RuneSlotInfo[]",
            "name": "r",
            "type": "tuple[]"
          },
          {
            "internalType": "int64",
            "name": "worldId",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "stageId",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "stageBuffId",
            "type": "int64"
          },
          {
            "internalType": "address",
            "name": "avatarAddress",
            "type": "address"
          },
          {
            "internalType": "int64",
            "name": "totalPlayCount",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "apStoneCount",
            "type": "int64"
          }
        ],
        "internalType": "struct HackAndSlashParser.HackAndSlash",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "input",
        "type": "bytes"
      }
    ],
    "name": "parseHackAndSlashFromSerializedPayload",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes16",
            "name": "id",
            "type": "bytes16"
          },
          {
            "internalType": "bytes16[]",
            "name": "costumes",
            "type": "bytes16[]"
          },
          {
            "internalType": "bytes16[]",
            "name": "equipments",
            "type": "bytes16[]"
          },
          {
            "internalType": "bytes16[]",
            "name": "foods",
            "type": "bytes16[]"
          },
          {
            "components": [
              {
                "internalType": "int64",
                "name": "slotIndex",
                "type": "int64"
              },
              {
                "internalType": "int64",
                "name": "runeId",
                "type": "int64"
              }
            ],
            "internalType": "struct RuneSlotInfo[]",
            "name": "r",
            "type": "tuple[]"
          },
          {
            "internalType": "int64",
            "name": "worldId",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "stageId",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "stageBuffId",
            "type": "int64"
          },
          {
            "internalType": "address",
            "name": "avatarAddress",
            "type": "address"
          },
          {
            "internalType": "int64",
            "name": "totalPlayCount",
            "type": "int64"
          },
          {
            "internalType": "int64",
            "name": "apStoneCount",
            "type": "int64"
          }
        ],
        "internalType": "struct HackAndSlashParser.HackAndSlash",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "input",
        "type": "bytes"
      }
    ],
    "name": "parseTransaction",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "typeId",
                "type": "string"
              },
              {
                "internalType": "bytes",
                "name": "value",
                "type": "bytes"
              }
            ],
            "internalType": "struct TransactionParser.Action[]",
            "name": "actions",
            "type": "tuple[]"
          },
          {
            "internalType": "bytes32",
            "name": "genesisHash",
            "type": "bytes32"
          },
          {
            "internalType": "int64",
            "name": "gasLimit",
            "type": "int64"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "uint8",
                    "name": "decimalPlaces",
                    "type": "uint8"
                  },
                  {
                    "internalType": "address[]",
                    "name": "minters",
                    "type": "address[]"
                  },
                  {
                    "internalType": "string",
                    "name": "ticker",
                    "type": "string"
                  },
                  {
                    "internalType": "bool",
                    "name": "totalSupplyTrackable",
                    "type": "bool"
                  },
                  {
                    "internalType": "uint256",
                    "name": "maximumSupplyMajor",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "maximumSupplyMinor",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct Currency",
                "name": "currency",
                "type": "tuple"
              },
              {
                "internalType": "uint256",
                "name": "rawValue",
                "type": "uint256"
              }
            ],
            "internalType": "struct FungibleAssetValue",
            "name": "maxGasPrice",
            "type": "tuple"
          },
          {
            "internalType": "int64",
            "name": "nonce",
            "type": "int64"
          },
          {
            "internalType": "bytes",
            "name": "publicKey",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "signer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "updatedAddresses",
            "type": "address[]"
          }
        ],
        "internalType": "struct TransactionParser.Transaction",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "input",
        "type": "bytes"
      }
    ],
    "name": "parseTransactionFromSerializedPayload",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "typeId",
                "type": "string"
              },
              {
                "internalType": "bytes",
                "name": "value",
                "type": "bytes"
              }
            ],
            "internalType": "struct TransactionParser.Action[]",
            "name": "actions",
            "type": "tuple[]"
          },
          {
            "internalType": "bytes32",
            "name": "genesisHash",
            "type": "bytes32"
          },
          {
            "internalType": "int64",
            "name": "gasLimit",
            "type": "int64"
          },
          {
            "components": [
              {
                "components": [
                  {
                    "internalType": "uint8",
                    "name": "decimalPlaces",
                    "type": "uint8"
                  },
                  {
                    "internalType": "address[]",
                    "name": "minters",
                    "type": "address[]"
                  },
                  {
                    "internalType": "string",
                    "name": "ticker",
                    "type": "string"
                  },
                  {
                    "internalType": "bool",
                    "name": "totalSupplyTrackable",
                    "type": "bool"
                  },
                  {
                    "internalType": "uint256",
                    "name": "maximumSupplyMajor",
                    "type": "uint256"
                  },
                  {
                    "internalType": "uint256",
                    "name": "maximumSupplyMinor",
                    "type": "uint256"
                  }
                ],
                "internalType": "struct Currency",
                "name": "currency",
                "type": "tuple"
              },
              {
                "internalType": "uint256",
                "name": "rawValue",
                "type": "uint256"
              }
            ],
            "internalType": "struct FungibleAssetValue",
            "name": "maxGasPrice",
            "type": "tuple"
          },
          {
            "internalType": "int64",
            "name": "nonce",
            "type": "int64"
          },
          {
            "internalType": "bytes",
            "name": "publicKey",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "signer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "updatedAddresses",
            "type": "address[]"
          }
        ],
        "internalType": "struct TransactionParser.Transaction",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;