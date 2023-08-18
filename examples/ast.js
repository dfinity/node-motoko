'use strict';

const mo = require('..');

mo.loadPackage(require('../packages/latest/base.json'));

const file = mo.file('Main.mo');
file.write(`
import { print } "mo:base/Debug";

actor Main {
    /// Doc comment
    public query func test() : async Nat {
        print("Hello!");
        123
    }
};
`);

const candid = mo.parseCandid(file.candid());
console.log('Candid AST:', candid);

const motoko = file.parseMotoko();
console.log('Motoko AST:', motoko);

const motokoTypes = file.parseMotokoTyped();
console.log('Motoko AST with types:', motokoTypes);
