'use strict'

/// Monaco editor configuration
exports.configure = (monaco) => {
    monaco.languages.register({ id: "motoko" });
    monaco.languages.setLanguageConfiguration("motoko", {
        comments: {
            lineComment: "//",
            blockComment: ["/*", "*/"],
        },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "<", close: ">" },
        ],
    });
    monaco.languages.setMonarchTokensProvider("motoko", {
        defaultToken: "",
        tokenPostfix: ".mo",
        // prettier-ignore
        keywords: [
            'actor', 'and', 'async', 'assert', 'await', 'break', 'case', 'catch', 'class',
            'continue', 'debug', 'debug_show', 'do', 'else', 'false', 'for', 'from_candid', 'func', 'if', 'ignore', 'in', 'import',
            'label', 'let', 'loop', 'module', 'not', 'null', 'object', 'or', 'return',
            'switch', 'throw', 'to_candid', 'true', 'try', 'type', 'var', 'while', 'with',
        ],
        accessmodifiers: [
            "public",
            "private",
            "flexible",
            "query",
            "shared",
            "stable",
            "system",
        ],
        // prettier-ignore
        typeKeywords: [
            'Any', 'None', 'Null', 'Bool', 'Int', 'Int8', 'Int16', 'Int32', 'Int64', 'Nat',
            'Nat8', 'Nat16', 'Nat32', 'Nat64', 'Float', 'Char', 'Text', 'Blob', 'Error', 'Principal',
        ],
        // prettier-ignore
        operators: [
            '=', '<', '>', ':', '<:', '?', '+', '-', '*', '/', '%', '**', '+%', '-%', '*%', '**%', '&', '|', '^', '<<', '>>', '<<>', '<>>',
            '#', '==', '!=', '>=', '<=', ':=', '+=', '-=', '*=', '/=', '%=', '**=', '+%=', '-%=', '*%=', '**%=', '&=', '|=',
            '^=', '<<=', '>>=', '#=', '->',
        ],
        symbols: /[=(){}[\].,:;@#_&\-<>`?!+*\\/]/,
        // C# style strings
        escapes:
            /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        tokenizer: {
            root: [
                // identifiers and keywords
                [
                    /[a-zA-Z_$][\w$]*/,
                    {
                        cases: {
                            "@typeKeywords": "keyword.type",
                            "@keywords": "keyword",
                            "@default": "identifier",
                        },
                    },
                ],
                // whitespace
                { include: "@whitespace" },

                // delimiters and operators
                [/[{}()[\]]/, "@brackets"],
                [/[<>](?!@symbols)/, "@brackets"],
                [/@symbols/, { cases: { "@operators": "operator", "@default": "" } }],
                // numbers
                [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
                [/0[xX][0-9a-fA-F_]+/, "number.hex"],
                [/[0-9_]+/, "number"],

                // delimiter: after number because of .\d floats
                [/[;,.]/, "delimiter"],

                // strings
                [/"([^"\\]|\\.)*$/, "string.invalid"], // non-teminated string
                [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

                // characters
                [/'[^\\']'/, "string"],
                [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
                [/'/, "string.invalid"],
            ],

            comment: [
                [/[^/*]+/, "comment"],
                [/\/\*/, "comment", "@push"], // nested comment
                ["\\*/", "comment", "@pop"],
                [/[/*]/, "comment"],
            ],

            string: [
                [/[^\\"]+/, "string"],
                [/@escapes/, "string.escape"],
                [/\\./, "string.escape.invalid"],
                [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
            ],

            whitespace: [
                [/[ \t\r\n]+/, "white"],
                [/\/\*/, "comment", "@comment"],
                [/\/\/.*$/, "comment"],
            ],
        },
    });
};
