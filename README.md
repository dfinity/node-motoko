# Motoko

### Compile [Motoko](https://smartcontracts.org/) smart contracts in Node.js and the browser.

## Installation:

`npm install --save motoko`

## Basic Example:

```js
import mo from 'motoko';
// -- OR --
const mo = require('motoko');

// Create a Motoko script in a virtual file system
mo.addFile('Main.mo', `
actor {
    public func hello() : async Text {
        "Hello, JavaScript!"
    }
}
`);

// Generate the corresponding Candid interface
console.log(mo.candid('Main.mo'))
```

## Advanced Usage:

```js

// Load dependencies
await mo.loadPackages({
    base: 'dfinity/motoko-base/master/src',
});

// Generate a Motoko AST
console.log(mo.parse('actor Main { public func test() : async Nat { 123 } }'));

// Generate a Candid AST
console.log(mo.parseCandid('service : { test : () -> (nat) }'));
```
