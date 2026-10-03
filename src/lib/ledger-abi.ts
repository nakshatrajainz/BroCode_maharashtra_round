export const ledgerAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "BadSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CompanyNotAllowed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LineAlreadyWritten",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MakerCannotHaveParent",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotKeeper",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ParentMissing",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "StampAlreadyUsed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnknownStamp",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongCategory",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "stamp",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "allowed",
        "type": "bool"
      }
    ],
    "name": "CompanyAllowanceChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "stamp",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "enum Ledger.Category",
        "name": "category",
        "type": "uint8"
      }
    ],
    "name": "CompanyRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "lineId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "stamp",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "parentId",
        "type": "bytes32"
      }
    ],
    "name": "LineWritten",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "stamp",
        "type": "address"
      }
    ],
    "name": "company",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "enum Ledger.Category",
            "name": "category",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "allowed",
            "type": "bool"
          },
          {
            "internalType": "uint64",
            "name": "registeredAt",
            "type": "uint64"
          }
        ],
        "internalType": "struct Ledger.Company",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "keeper",
    "outputs": [
      {
        "internalType": "address",
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
        "internalType": "bytes32",
        "name": "lineId",
        "type": "bytes32"
      }
    ],
    "name": "line",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "parentId",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "stamp",
            "type": "address"
          },
          {
            "internalType": "enum Ledger.Category",
            "name": "action",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "exactFingerprint",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "lookalikeFingerprint",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "hiddenId",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "sealedPrompt",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "writtenAt",
            "type": "uint64"
          }
        ],
        "internalType": "struct Ledger.Line",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "lineExists",
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
        "internalType": "address",
        "name": "stamp",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "enum Ledger.Category",
        "name": "category",
        "type": "uint8"
      }
    ],
    "name": "registerCompany",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "stamp",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "allowed",
        "type": "bool"
      }
    ],
    "name": "setAllowed",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "lineId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "parentId",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "stamp",
        "type": "address"
      },
      {
        "internalType": "enum Ledger.Category",
        "name": "action",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "exactFingerprint",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "lookalikeFingerprint",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "hiddenId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "sealedPrompt",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "writeLine",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
