'use strict';

const mo = require('../lib/versions/moc').default;

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

const candid = file.candid();
console.log(candid);
