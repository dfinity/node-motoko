const mo = require('..');

const actorMo = `
import Nat "mo:base/Nat";

actor Main {
    public func test() : async Nat {
        123
    }
}
`;

// const actorMo = `
// actor {
//     public func test() : async Nat {
//         123
//     }
// }
// `;

const baseInfo = {
    name: 'base',
    repo: 'https://github.com/dfinity/motoko-base.git',
    dir: 'src',
    version: 'master',
    homepage: 'https://sdk.dfinity.org/docs/base-libraries/stdlib-intro.html',
};

(async () => {
    await mo.loadPackage(baseInfo);

    mo.addFile('Main.mo', actorMo);

    // let x = Motoko.compileWasm('ic', 'Main.mo');
    // console.log(x);

    const visit = (node) => {
        console.log(node);

        for (let arg of node.args) {
            console.log(arg);
        }
    };

    const ast = mo.parse(actorMo);

    // console.log(ast);

    console.log(mo.getFiles('.'));
    console.log(mo.getFiles('base'));

    const candid = mo.candid('Main.mo');
    console.log(candid);
    console.log(mo.parseCandid(candid));

    // console.log(JSON.stringify(ast, null, 1));
})().catch((err) => console.error(err.stack || err));
