/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/payment_engine.json`.
 */
export type PaymentEngine = {
  "address": "AeaX15Xn4YCSLGBvf1EMdjHViewi28odizgfyQ3RLD9e",
  "metadata": {
    "name": "paymentEngine",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "makeEscrow",
      "discriminator": [
        200,
        121,
        247,
        236,
        215,
        67,
        237,
        104
      ],
      "accounts": [
        {
          "name": "user",
          "docs": [
            "The user creating and paying for the escrow, must be the transaction signer"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "docs": [
            "New escrow account that will be created to store payment details.",
            "The account address is derived from \"escrow\", user's pubkey and a seed number"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "seed"
              }
            ]
          }
        },
        {
          "name": "userAccount",
          "docs": [
            "User's account storing subscription and request information.",
            "Created if it doesn't exist yet."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "usdcMint",
          "docs": [
            "The USDC token mint account used for payments"
          ]
        },
        {
          "name": "swquery",
          "docs": [
            "The SWQuery's main account that will receive the payment"
          ]
        },
        {
          "name": "userTokenAccount",
          "docs": [
            "The user's USDC token account that will be debited"
          ],
          "writable": true
        },
        {
          "name": "swqueryTokenAccount",
          "docs": [
            "SWQuery's USDC token account that will receive the payment"
          ],
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        },
        {
          "name": "planId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "swqueryEscrow",
      "discriminator": [
        201,
        7,
        3,
        252,
        222,
        197,
        3,
        186
      ]
    },
    {
      "name": "userAccount",
      "discriminator": [
        211,
        33,
        136,
        16,
        186,
        110,
        242,
        127
      ]
    }
  ],
  "events": [
    {
      "name": "transactionSuccessful",
      "discriminator": [
        29,
        31,
        62,
        220,
        163,
        113,
        22,
        69
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidTokenAmount",
      "msg": "Invalid token amount."
    },
    {
      "code": 6001,
      "name": "signatureNotVerified",
      "msg": "User signature not verified."
    },
    {
      "code": 6002,
      "name": "planNotFound",
      "msg": "Plan not found."
    },
    {
      "code": 6003,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow."
    },
    {
      "code": 6004,
      "name": "invalidMint",
      "msg": "Invalid mint."
    }
  ],
  "types": [
    {
      "name": "plan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "requests",
            "type": "u32"
          },
          {
            "name": "description",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "swqueryEscrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seed",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "swquery",
            "type": "pubkey"
          },
          {
            "name": "usdcMint",
            "type": "pubkey"
          },
          {
            "name": "usdcAmount",
            "type": "u64"
          },
          {
            "name": "selectedPlan",
            "type": {
              "option": {
                "defined": {
                  "name": "plan"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "transactionSuccessful",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "planId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "userAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "totalRequests",
            "type": "u64"
          },
          {
            "name": "subscribedPlans",
            "type": {
              "vec": {
                "defined": {
                  "name": "plan"
                }
              }
            }
          }
        ]
      }
    }
  ]
};
