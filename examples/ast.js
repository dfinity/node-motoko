'use strict';

const mo = require('..');

mo.loadPackage(require('../packages/latest/base.json'));

const file = mo.file('Main.mo');
file.write(`
import { print } "mo:base/Debug";

actor Main {
    /// Doc comment
    public query func test() : async Nat {
        123
    }
};
`);

const candid = mo.parseCandid(file.candid());
console.log('Candid AST:', JSON.stringify(candid, null, 1));

const motoko = file.parseMotoko();
console.log('Motoko AST:', JSON.stringify(motoko, null, 1));

const motokoTypes = file.parseMotokoTyped();
console.log('Motoko AST with types:', JSON.stringify(motokoTypes, null, 1));
