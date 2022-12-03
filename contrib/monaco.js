'use strict';

const { keywords, typeKeywords } = require('../lib/keywords');
const snippetConfig = require('./snippets.json');

/// Monaco editor configuration
exports.configure = (monaco, { snippets } = {}) => {
    monaco.languages.register({ id: 'motoko' });
    monaco.languages.setLanguageConfiguration('motoko', {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '<', close: '>' },
        ],
    });
    monaco.languages.setMonarchTokensProvider('motoko', {
        defaultToken: '',
        tokenPostfix: '.mo',
        // prettier-ignore
        keywords,
        accessmodifiers: [
            'public',
            'private',
            'flexible',
            'query',
            'shared',
            'stable',
            'system',
        ],
        // prettier-ignore
        typeKeywords,
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
                            '@typeKeywords': 'keyword.type',
                            '@keywords': 'keyword',
                            '@default': 'identifier',
                        },
                    },
                ],
                // whitespace
                { include: '@whitespace' },

                // delimiters and operators
                [/[{}()[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [
                    /@symbols/,
                    { cases: { '@operators': 'operator', '@default': '' } },
                ],
                // numbers
                [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F_]+/, 'number.hex'],
                [/[0-9_]+/, 'number'],

                // delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],

                // strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                [
                    /"/,
                    {
                        token: 'string.quote',
                        bracket: '@open',
                        next: '@string',
                    },
                ],

                // characters
                [/'[^\\']'/, 'string'],
                [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                [/'/, 'string.invalid'],
            ],

            comment: [
                [/[^/*]+/, 'comment'],
                [/\/\*/, 'comment', '@push'], // nested comment
                ['\\*/', 'comment', '@pop'],
                [/[/*]/, 'comment'],
            ],

            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [
                    /"/,
                    { token: 'string.quote', bracket: '@close', next: '@pop' },
                ],
            ],

            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],
        },
    });

    if (snippets) {
        monaco.languages.registerCompletionItemProvider('motoko', {
            provideCompletionItems() {
                return {
                    suggestions: Object.entries(snippetConfig).map(
                        ([name, snippet]) => {
                            return {
                                label:
                                    typeof snippet.prefix === 'string'
                                        ? snippet.prefix
                                        : snippet.prefix[0],
                                detail: name,
                                insertText:
                                    typeof snippet.body === 'string'
                                        ? snippet.body
                                        : snippet.body.join('\n'),
                                // insert as snippet (https://microsoft.github.io/monaco-editor/api/enums/monaco.languages.CompletionItemInsertTextRule.html)
                                insertTextRules: 4,
                                // snippet completion (https://microsoft.github.io/monaco-editor/api/enums/monaco.languages.CompletionItemKind.html)
                                kind: 27,
                            };
                        },
                    ),
                };
            },
        });
    }
};
