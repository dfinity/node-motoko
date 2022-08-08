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

const motokoAST = file.parseMotoko();
console.log('Motoko AST:', motokoAST);

const candidAST = mo.parseCandid(file.candid());
console.log('Candid AST:', candidAST);
