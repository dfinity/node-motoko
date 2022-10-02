'use strict';

const mo = require('..');

const file = mo.file('Main.mo');
file.write(`
actor Main {
    public query func test() : async Nat {
        123
    }
}
`);

// const candid = mo.parseCandid(file.candid());
// console.log('Candid AST:', JSON.stringify(candid, null, 1));

// const motoko = file.parseMotoko();
// console.log('Motoko AST:', JSON.stringify(motoko, null, 1));

// const motokoTypes = file.parseMotokoTypes();
// console.log('Motoko AST with types:', JSON.stringify(motokoTypes, null, 1));

mo.loadPackage(require('../packages/latest/base.json'));
file.write('import Debug "mo:base/Debug"; Debug');
const result = file.parseMotokoTyped();
console.log('Motoko AST with types:', JSON.stringify(result, null, 1));
