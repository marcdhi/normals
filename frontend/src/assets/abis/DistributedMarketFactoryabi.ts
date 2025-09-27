export const abi = [
    {
        "type": "function",
        "name": "createMarket",
        "inputs": [
            {
                "name": "_initialMean",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "_initialSigma",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "_k",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "_b",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "_description",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "deployedMarkets",
        "inputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getDeployedMarkets",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address[]",
                "internalType": "address[]"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "MarketCreated",
        "inputs": [
            {
                "name": "marketAddress",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "description",
                "type": "string",
                "indexed": false,
                "internalType": "string"
            }
        ],
        "anonymous": false
    }


]