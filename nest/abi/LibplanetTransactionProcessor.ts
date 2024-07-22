export const abi = [
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
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "blockIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "transactionIndex",
        "type": "uint256"
      }
    ],
    "name": "TransactionParsedIndex",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "blockIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum LibplanetTransactionProcessor.Status",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "TransactionProcessed",
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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "blockIndex",
        "type": "uint256"
      },
      {
        "internalType": "bytes[]",
        "name": "input",
        "type": "bytes[]"
      }
    ],
    "name": "processTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;