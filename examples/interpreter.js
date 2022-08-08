'use strict';

const mo = require('../interpreter'); // 'motoko/latest/interpreter'

const file = mo.file('Main.mo');
file.write(`
let x = 0;
x
`);

console.log(file.run());

// const ast = file.parseMotoko();
// // console.log(ast);

// console.log(mo.list('.'));
// // console.log(mo.listFiles('base'));

// const candid = file.candid();
// console.log(candid);

// const candidAST = mo.parseCandid(candid);
// console.log(candidAST);
