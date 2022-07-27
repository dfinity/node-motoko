# Motoko

### Compile [Motoko smart contracts](https://smartcontracts.org/) in Node.js and the browser.

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

// Generate a Candid interface
console.log(mo.candid('Main.mo'))
```

## Advanced Usage:

```js

// Load dependencies
await mo.loadPackages({
    base: 'dfinity/motoko-base/master/src',
});

// Generate the AST for a Motoko file
console.log(mo.parse('actor Main { public func test() : async Nat { 123 } }'));

// Generate the AST for a Candid file
console.log(mo.parseCandid('service : { test : () -> (nat) }'));
```
