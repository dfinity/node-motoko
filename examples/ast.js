'use strict';

const mo = require('..');

const actorMo = `
// import Nat "mo:base/Nat";

actor Main {
    public func test() : async Nat {
        123
    }
}
`;

(async () => {
    // await mo.loadPackages({
    //     base: 'dfinity/motoko-base/master/src',
    // });

    mo.addFile('Main.mo', actorMo);

    // let x = Motoko.compileWasm('ic', 'Main.mo');
    // console.log(x);

    const ast = mo.parse(actorMo);
    // console.log(ast);

    console.log(mo.listFiles('.'));
    // console.log(mo.listFiles('base'));

    const candid = mo.candid('Main.mo');
    console.log(candid);

    const candidAST = mo.parseCandid(candid);
    console.log(candidAST);

    // mo.wasm('wasi', 'Main.mo');

    // console.log(JSON.stringify(ast, null, 1));
})().catch((err) => console.error(err.stack || err));
