export const abi = [
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
          "components": [
            {
              "internalType": "enum LibplanetTransactionResultsStore.TxStatus",
              "name": "txStatus",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "blockHash",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "inputState",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "outputState",
              "type": "bytes32"
            }
          ],
          "indexed": false,
          "internalType": "struct LibplanetTransactionResultsStore.TransactionResult",
          "name": "txResult",
          "type": "tuple"
        }
      ],
      "name": "TxResultStored",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "blockIndex",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "txId",
          "type": "bytes32"
        },
        {
          "components": [
            {
              "internalType": "enum LibplanetTransactionResultsStore.TxStatus",
              "name": "txStatus",
              "type": "uint8"
            },
            {
              "internalType": "bytes32",
              "name": "blockHash",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "inputState",
              "type": "bytes32"
            },
            {
              "internalType": "bytes32",
              "name": "outputState",
              "type": "bytes32"
            }
          ],
          "internalType": "struct LibplanetTransactionResultsStore.TransactionResult",
          "name": "txResult",
          "type": "tuple"
        }
      ],
      "name": "storeTxResult",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const;