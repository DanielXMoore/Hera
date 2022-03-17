module.exports = {
  "Grammar": [
    "S",
    [
      [
        "*",
        "EOS"
      ],
      [
        "+",
        "Rule"
      ]
    ],
    {
      "f": "return Object.fromEntries($2)"
    }
  ],
  "Rule": [
    "S",
    [
      "Name",
      "EOS",
      "RuleBody"
    ],
    [
      1,
      3
    ]
  ],
  "RuleBody": [
    "+",
    [
      "S",
      [
        "Indent",
        "Choice"
      ]
    ],
    {
      "f": "var r = $1.map((a) => a[1])\nif (r.length === 1) return r[0];\nreturn [\"/\", r]"
    }
  ],
  "Choice": [
    "S",
    [
      "Sequence",
      "Handling"
    ],
    {
      "f": "if ($2 !== undefined) {\n  if (!$1.push)\n    $1 = [\"S\", [$1], $2]\n  else\n    $1.push($2)\n}\nreturn $1"
    }
  ],
  "Sequence": [
    "/",
    [
      [
        "S",
        [
          "Expression",
          [
            "+",
            "SequenceExpression"
          ]
        ],
        {
          "f": "$2.unshift($1)\nreturn [\"S\", $2]"
        }
      ],
      [
        "S",
        [
          "Expression",
          [
            "+",
            "ChoiceExpression"
          ]
        ],
        {
          "f": "$2.unshift($1)\nreturn [\"/\", $2]"
        }
      ],
      "Expression"
    ]
  ],
  "SequenceExpression": [
    "S",
    [
      "_",
      "Expression"
    ],
    2
  ],
  "ChoiceExpression": [
    "S",
    [
      "_",
      [
        "L",
        "/"
      ],
      "_",
      "Expression"
    ],
    4
  ],
  "Expression": [
    "/",
    [
      "Suffix",
      [
        "S",
        [
          "PrefixOperator",
          "Suffix"
        ],
        [
          1,
          2
        ]
      ]
    ]
  ],
  "PrefixOperator": [
    "R",
    "[$&!]"
  ],
  "Suffix": [
    "/",
    [
      [
        "S",
        [
          "Primary",
          "SuffixOperator"
        ],
        [
          2,
          1
        ]
      ],
      "Primary"
    ]
  ],
  "SuffixOperator": [
    "R",
    "[+?*]"
  ],
  "Primary": [
    "/",
    [
      "Name",
      "Literal",
      [
        "S",
        [
          "OpenParenthesis",
          "Sequence",
          "CloseParenthesis"
        ],
        2
      ]
    ]
  ],
  "Literal": [
    "/",
    [
      "StringLiteral",
      "RegExpLiteral"
    ]
  ],
  "Handling": [
    "/",
    [
      [
        "S",
        [
          "EOS"
        ],
        {
          "f": "return undefined"
        }
      ],
      [
        "S",
        [
          [
            "*",
            "_"
          ],
          "Arrow",
          "HandlingExpression"
        ],
        3
      ]
    ]
  ],
  "HandlingExpression": [
    "/",
    [
      [
        "S",
        [
          "EOS",
          "HandlingExpressionBody"
        ],
        2
      ],
      [
        "S",
        [
          "StringValue",
          "EOS"
        ],
        1
      ],
      [
        "S",
        [
          "HandlingExpressionValue",
          "EOS"
        ],
        1
      ]
    ]
  ],
  "HandlingExpressionBody": [
    "+",
    "HandlingExpressionLine",
    {
      "f": "return {\n  f: $1.join(\"\\n\")\n}"
    }
  ],
  "HandlingExpressionLine": [
    "S",
    [
      "Indent",
      "Indent",
      [
        "R",
        "[^\\n\\r]*"
      ],
      "EOS"
    ],
    3
  ],
  "HandlingExpressionValue": [
    "/",
    [
      "RValue",
      [
        "S",
        [
          "OpenBracket",
          "RValue",
          [
            "*",
            "CommaThenValue"
          ],
          "CloseBracket"
        ],
        {
          "f": "$3.unshift($2); return $3"
        }
      ]
    ]
  ],
  "RValue": [
    "/",
    [
      "StringValue",
      [
        "R",
        "\\d\\d?",
        {
          "f": "return parseInt($0, 10)"
        }
      ]
    ]
  ],
  "CommaThenValue": [
    "S",
    [
      [
        "*",
        "_"
      ],
      [
        "L",
        ","
      ],
      [
        "*",
        "_"
      ],
      "RValue",
      [
        "*",
        "_"
      ]
    ],
    4
  ],
  "StringValue": [
    "S",
    [
      [
        "L",
        "\\\""
      ],
      [
        "*",
        "DoubleStringCharacter"
      ],
      [
        "L",
        "\\\""
      ]
    ],
    {
      "f": "return $2.join('')"
    }
  ],
  "DoubleStringCharacter": [
    "/",
    [
      [
        "R",
        "[^\"\\\\]+"
      ],
      "EscapeSequence"
    ]
  ],
  "EscapeSequence": [
    "S",
    [
      "Backslash",
      [
        "R",
        "[^]"
      ]
    ],
    {
      "f": "return '\\\\' + $2"
    }
  ],
  "StringLiteral": [
    "S",
    [
      "StringValue"
    ],
    [
      "L",
      1
    ]
  ],
  "RegExpLiteral": [
    "/",
    [
      [
        "S",
        [
          [
            "L",
            "/"
          ],
          [
            "!",
            "_"
          ],
          [
            "*",
            "RegExpCharacter"
          ],
          [
            "L",
            "/"
          ]
        ],
        {
          "f": "return [\"R\", $3.join('')]"
        }
      ],
      "CharacterClassExpression"
    ]
  ],
  "CharacterClassExpression": [
    "+",
    "CharacterClass",
    {
      "f": "return [\"R\", $1.join('')]"
    }
  ],
  "RegExpCharacter": [
    "/",
    [
      [
        "R",
        "[^\\/\\\\]+"
      ],
      "EscapeSequence"
    ]
  ],
  "CharacterClass": [
    "S",
    [
      [
        "L",
        "["
      ],
      [
        "*",
        "CharacterClassCharacter"
      ],
      [
        "L",
        "]"
      ],
      [
        "?",
        "Quantifier"
      ]
    ],
    {
      "f": "return \"[\" + $2.join('') + \"]\" + ($4 || \"\")"
    }
  ],
  "CharacterClassCharacter": [
    "/",
    [
      [
        "R",
        "[^\\]\\\\]+"
      ],
      "EscapeSequence"
    ]
  ],
  "Quantifier": [
    "R",
    "[?+*]|\\{\\d+(,\\d+)?\\}"
  ],
  "Name": [
    "R",
    "[_a-zA-Z][_a-zA-Z0-9]*"
  ],
  "Arrow": [
    "S",
    [
      [
        "L",
        "->"
      ],
      [
        "*",
        "_"
      ]
    ]
  ],
  "Backslash": [
    "L",
    "\\\\"
  ],
  "OpenBracket": [
    "R",
    "\\[[ \\t]*"
  ],
  "CloseBracket": [
    "R",
    "\\][ \\t]*"
  ],
  "OpenParenthesis": [
    "R",
    "\\([ \\t]*"
  ],
  "CloseParenthesis": [
    "R",
    "[ \\t]*\\)"
  ],
  "Indent": [
    "L",
    "  "
  ],
  "_": [
    "R",
    "[ \\t]+"
  ],
  "EOS": [
    "R",
    "([ \\t]*(#[^\\n\\r]*)?(\\n|\\r\\n|\\r|$))+"
  ]
}
