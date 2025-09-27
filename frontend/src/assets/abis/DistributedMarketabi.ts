export const abi = [
    {
        "type": "constructor",
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
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "b",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "k",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "mean",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "quoteCollateral",
        "inputs": [
            {
                "name": "newMean",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "newSigma",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ],
        "outputs": [
            {
                "name": "collateral",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "argminX",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "standardDeviation",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "trade",
        "inputs": [
            {
                "name": "newMean",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "newSigma",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "argminX",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "event",
        "name": "MarketUpdated",
        "inputs": [
            {
                "name": "newMean",
                "type": "int256",
                "indexed": false,
                "internalType": "SD59x18"
            },
            {
                "name": "newSigma",
                "type": "int256",
                "indexed": false,
                "internalType": "SD59x18"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "PRBMath_MulDiv18_Overflow",
        "inputs": [
            {
                "name": "x",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "y",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_MulDiv_Overflow",
        "inputs": [
            {
                "name": "x",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "y",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "denominator",
                "type": "uint256",
                "internalType": "uint256"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Abs_MinSD59x18",
        "inputs": []
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Div_InputTooSmall",
        "inputs": []
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Div_Overflow",
        "inputs": [
            {
                "name": "x",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "y",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Exp2_InputTooBig",
        "inputs": [
            {
                "name": "x",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Exp_InputTooBig",
        "inputs": [
            {
                "name": "x",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Mul_InputTooSmall",
        "inputs": []
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Mul_Overflow",
        "inputs": [
            {
                "name": "x",
                "type": "int256",
                "internalType": "SD59x18"
            },
            {
                "name": "y",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Sqrt_NegativeInput",
        "inputs": [
            {
                "name": "x",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ]
    },
    {
        "type": "error",
        "name": "PRBMath_SD59x18_Sqrt_Overflow",
        "inputs": [
            {
                "name": "x",
                "type": "int256",
                "internalType": "SD59x18"
            }
        ]
    }

]