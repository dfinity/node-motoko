
# `motoko` &nbsp;[![npm version](https://img.shields.io/npm/v/motoko.svg?logo=npm)](https://www.npmjs.com/package/motoko) [![GitHub license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/dfinity/motoko/issues)

> #### Compile and run [Motoko](https://smartcontracts.org/) smart contracts in Node.js or the browser.

---

## Installation:

```sh
npm i --save motoko
```

## Examples:

### Basic usage

```js
import mo from 'motoko';
// -- OR --
const mo = require('motoko');

// Create a Motoko script in a virtual file system
mo.write('Main.mo', `
  actor {
      public query func hello() : async Text {
          "Hello, JavaScript!"
      };
  }
`);

// Generate the corresponding Candid interface
console.log(mo.candid('Main.mo'));
```

### Evaluate a program

```js
mo.write('Main.mo', `
  actor Main {
    public query func hello() : async Text {
      "Hello, world!"
    };
  };
  await Main.hello();
`)
mo.run('Main.mo');
```

### Evaluate a program (shorthand)

```js
mo.file('Main.mo')
    .write('actor Main { public query func getNumber() : async Nat { 5 } }')
    .run();
```

### Load dependencies from GitHub

```js
mo.clearPackages();
await mo.installPackages({
    base: 'dfinity/motoko-base/master/src', // import "mo:base/...";
});
```

### Generate parse trees

```js
// Generate a Motoko AST
console.log(mo.parseMotoko('actor Main { public query func test() : async Nat { 123 } }'));

// Generate a Candid AST
console.log(mo.parseCandid('service : { test : () -> (nat) }'));
```

### Optimize for browsers

```js
// Load just the `write()`, `loadPackages()`, `clearPackages()`, and `run()`, operations for a smaller file size:
import mo from 'motoko/interpreter';
```

## API:

### Top-level API

```js
// Read the contents of a virtual file
mo.read(path)

// Write a string to a virtual file
mo.write(path, string)

// Rename a virtual file
mo.rename(path, newPath)

// Delete a virtual file
mo.delete(path)

// List the files in a virtual directory
mo.list(path)

// Fetch a package from GitHub or jsDelivr
await mo.fetchPackage(name, source);
await mo.fetchPackage('base', 'dfinity/motoko-base/master/src');

// Try to fetch and load packages from GitHub or jsDelivr
await mo.installPackages({ [packageName]: repositoryPath, ... })

// Load a value returned from `fetchPackage()`
mo.loadPackage(package)

// Use a virtual directory as a package
mo.usePackage(packageName, directory)

// Clear loaded packages
mo.clearPackages()

// Ensure that a package is correctly formatted
mo.validatePackage(package)

// Configure the compiler to resolve `import "mo:{alias}";` -> `import "canister:{id}";`
// `directory` should contain `*.did` files for canister dependencies
mo.setAliases(directory, { alias: id, ... })

// Set the public metadata (an array of strings) used by the compiler
mo.setMetadata(strings)

// Set the maximum number of interpreter steps before cancelling a `run()` invocation
mo.setRunStepLimit(limit)

// Generate errors and warnings for a Motoko program
mo.check(path)

// Run a Motoko program with optional virtual library paths
mo.run(path)
mo.run(path, [libraryPath, ...])

// Generate the Candid interface for a Motoko program
mo.candid(path)

// Compile a Motoko program to WebAssembly
mo.wasm(path, 'ic') // IC interface format (default)
mo.wasm(path, 'wasi') // WASI interface format

// Return the parse tree for a Candid string
mo.parseCandid(candidString)

// Return the parse tree for a Motoko string
mo.parseMotoko(motokoString)

// Return the typed parse tree for a Motoko file path (or array of paths)
mo.parseMotokoTyped(path)
mo.parseMotokoTyped(paths = [...])

// Find the 'Main.mo' file or an equivalent canister entry point
mo.resolveMain(directory = '')

// Find the 'Lib.mo' file or an equivalent library entry point
mo.resolveLib(directory = '')

// Get the compiler version ('latest' by default)
mo.version

// Access the underlying Motoko compiler
mo.compiler
```

### File API

```js
// Create an object representing a virtual file
const file = mo.file('Main.mo')

// Get the file path
file.path

// Get another file object with the same path
file.clone()

// Read the file as a string
file.read()

// Write a string to the file
file.write(string)

// Rename the file
file.rename(newPath)

// Delete the file
file.delete()

// List children (if a directory)
file.list()

// Generate errors and warnings for a Motoko program
file.check()

// Run the file as a Motoko program
file.run()

// Generate the Candid interface for a Motoko program
file.candid()

// Compile the file to WebAssembly (see `mo.wasm()`)
file.wasm('ic')
file.wasm('wasi') // note: cannot contain actors

// Parse the file as a Motoko program
file.parseMotoko()

// Parse the file as a Candid interface
file.parseCandid()

// Parse the file (with types) as a Motoko program
file.parseMotokoTyped()
```
