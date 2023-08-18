'use strict';

const mo = require('../lib/versions/moc').default;

mo.loadPackage(require('../packages/latest/base.json'));

const file = mo.file('Main.mo');
file.write(`
/// Doc comment

import { print } "mo:base/Debug";

actor Main {
    /// Type alias
    type T = Nat;

    /// Actor method
    public query func test() : async T {
        print("Hello!");
        123
    }
};
`);

const candid = file.candid();
console.log(candid);
