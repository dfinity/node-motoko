'use strict';

const mo = require('..');

// // Compile a WASM file for the IC

// const icFile = mo.file('IC.mo');
// icFile.write(`
// actor {
//     var value: Int = 0;

//     public func get() : async Int {
//         value
//     };

//     public func inc() {
//         value += 1
//     };
// };
// `);
// const icResult = icFile.wasm('ic');
// console.log('IC:', icResult);

// Compile a WASI module (runnable in the browser)

const wasiFile = mo.file('WASI.mo');
wasiFile.write(`
import { debugPrint = print } "mo:⛔";

module Interface {
    public let value = 5;
};

print(">>> value = " # debug_show Interface.value);
`);

const wasiResult = wasiFile.wasm('wasi');
console.log('WASI:', wasiResult);

const wasi = require('../lib/wasm/wasi').default;

console.log(wasi(wasiResult));
