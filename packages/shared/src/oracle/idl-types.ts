/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/skyline_oracle.json`.
 */
export type SkylineOracle = {
  "address": "GfqqReCNqXhF23RpijJEV9TKu2tVGbK1ucmmmicTK5c6",
  "metadata": {
    "name": "skylineOracle",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeMarket",
      "docs": [
        "Close a market after its fixture is settled, reclaiming rent."
      ],
      "discriminator": [
        88,
        154,
        248,
        186,
        48,
        14,
        123,
        244
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "publisher"
          ]
        },
        {
          "name": "publisher",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  98,
                  108,
                  105,
                  115,
                  104,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "initializeMarket",
      "docs": [
        "Create a market account for a specific fixture. Idempotent per market_id."
      ],
      "discriminator": [
        35,
        35,
        189,
        193,
        155,
        48,
        170,
        203
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "publisher"
          ]
        },
        {
          "name": "publisher",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  98,
                  108,
                  105,
                  115,
                  104,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "fixtureId",
          "type": "u64"
        },
        {
          "name": "home",
          "type": "string"
        },
        {
          "name": "away",
          "type": "string"
        },
        {
          "name": "kickoffTs",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializePublisher",
      "docs": [
        "One-time registration of the publisher (the fair-value engine wallet).",
        "The publisher is the only signer permitted to publish updates."
      ],
      "discriminator": [
        66,
        1,
        62,
        232,
        118,
        238,
        23,
        25
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "publisher",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  98,
                  108,
                  105,
                  115,
                  104,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "publishUpdate",
      "docs": [
        "Publish a new fair-value snapshot for a market. Probabilities in basis",
        "points (1 bps = 0.01%; 10000 bps = 100%). Sum must be within tolerance",
        "of 10000. `txline_proof_ref` is the hash of the underlying TxLINE",
        "validation proof so consumers can independently verify provenance."
      ],
      "discriminator": [
        148,
        42,
        196,
        204,
        153,
        142,
        74,
        49
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "publisher"
          ]
        },
        {
          "name": "publisher",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  98,
                  108,
                  105,
                  115,
                  104,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "market",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "probabilities",
          "type": {
            "array": [
              "u16",
              3
            ]
          }
        },
        {
          "name": "confHalfWidths",
          "type": {
            "array": [
              "u16",
              3
            ]
          }
        },
        {
          "name": "txlineProofRef",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "marketAccount",
      "discriminator": [
        201,
        78,
        187,
        225,
        240,
        198,
        201,
        251
      ]
    },
    {
      "name": "publisherRegistry",
      "discriminator": [
        82,
        231,
        164,
        67,
        171,
        211,
        102,
        152
      ]
    }
  ],
  "events": [
    {
      "name": "fairValueUpdated",
      "discriminator": [
        244,
        124,
        198,
        72,
        156,
        132,
        152,
        157
      ]
    },
    {
      "name": "marketClosed",
      "discriminator": [
        86,
        91,
        119,
        43,
        94,
        0,
        217,
        113
      ]
    },
    {
      "name": "marketInitialized",
      "discriminator": [
        134,
        160,
        122,
        87,
        50,
        3,
        255,
        81
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Only the registered publisher can publish updates"
    },
    {
      "code": 6001,
      "name": "invalidProbabilitySum",
      "msg": "Probability basis-points must sum to 10000 within tolerance"
    },
    {
      "code": 6002,
      "name": "invalidProbabilityValue",
      "msg": "Individual probability exceeds 10000 bps"
    },
    {
      "code": 6003,
      "name": "invalidConfidenceValue",
      "msg": "Confidence half-width exceeds 10000 bps"
    },
    {
      "code": 6004,
      "name": "nameTooLong",
      "msg": "String length exceeds MAX_NAME_LEN bytes"
    },
    {
      "code": 6005,
      "name": "kickoffInPast",
      "msg": "Kickoff timestamp must be in the future at market init"
    },
    {
      "code": 6006,
      "name": "closedTooEarly",
      "msg": "Market cannot be closed before its fixture kicks off"
    },
    {
      "code": 6007,
      "name": "nameEmpty",
      "msg": "Publisher name cannot be empty"
    }
  ],
  "types": [
    {
      "name": "fairValueUpdate",
      "docs": [
        "Basis-point encoded fair-value snapshot. All values in bps (10000 = 100.00%)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "homeProbBps",
            "type": "u16"
          },
          {
            "name": "drawProbBps",
            "type": "u16"
          },
          {
            "name": "awayProbBps",
            "type": "u16"
          },
          {
            "name": "homeConfBps",
            "type": "u16"
          },
          {
            "name": "drawConfBps",
            "type": "u16"
          },
          {
            "name": "awayConfBps",
            "type": "u16"
          },
          {
            "name": "txlineProofRef",
            "docs": [
              "Hash reference to the TxLINE validation proof used for this update.",
              "Consumers can independently fetch the proof via TxLINE's API and verify",
              "it against TxLINE's on-chain program."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "publishedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "fairValueUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "fixtureId",
            "type": "u64"
          },
          {
            "name": "homeProbBps",
            "type": "u16"
          },
          {
            "name": "drawProbBps",
            "type": "u16"
          },
          {
            "name": "awayProbBps",
            "type": "u16"
          },
          {
            "name": "publishedAt",
            "type": "i64"
          },
          {
            "name": "sequence",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketAccount",
      "docs": [
        "A sports market with the latest published fair-value.",
        "PDA seeds: [b\"market\", market_id (32 bytes)]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "fixtureId",
            "type": "u64"
          },
          {
            "name": "home",
            "type": "string"
          },
          {
            "name": "away",
            "type": "string"
          },
          {
            "name": "kickoffTs",
            "type": "i64"
          },
          {
            "name": "current",
            "type": {
              "defined": {
                "name": "fairValueUpdate"
              }
            }
          },
          {
            "name": "lastUpdatedTs",
            "type": "i64"
          },
          {
            "name": "updateCount",
            "type": "u64"
          },
          {
            "name": "publisher",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "marketClosed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "fixtureId",
            "type": "u64"
          },
          {
            "name": "totalUpdates",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "fixtureId",
            "type": "u64"
          },
          {
            "name": "kickoffTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "publisherRegistry",
      "docs": [
        "Registry of the trusted publisher for the Skyline Oracle instance.",
        "Only this authority can call `publish_update`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "publishedCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "marketSeed",
      "type": "bytes",
      "value": "[109, 97, 114, 107, 101, 116]"
    },
    {
      "name": "publisherSeed",
      "type": "bytes",
      "value": "[112, 117, 98, 108, 105, 115, 104, 101, 114]"
    }
  ]
};
