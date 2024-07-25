export const abi = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "txId",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "result",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "stateRootHash",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "key",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "value",
          "type": "bytes"
        }
      ],
      "name": "ProofVerified",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "txId",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "stateRootHash",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "key",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "value",
          "type": "bytes"
        }
      ],
      "name": "verifyProof",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const