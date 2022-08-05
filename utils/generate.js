'use strict';

const fs = require('fs');
const { resolve } = require('path');
const { minify } = require('uglify-js');

const motokoRepoPath =
    process.env.MOTOKO_REPO || resolve(__dirname, '../../motoko');

// Generate `moc.js` from (https://github.com/dfinity/motoko):
// $ cd ../motoko
// $ nix-shell
// $ make -C src moc.js

// Reduce moc.js from ~21 MB to ~5 MB
var result = minify(
    fs.readFileSync(resolve(motokoRepoPath, 'src/moc.js'), 'utf-8'),
);

fs.writeFileSync(resolve(__dirname, '../lib/generated/moc.js'), result.code);

console.log('Done');
