'use strict';

// Generate `moc.js` from (https://github.com/dfinity/motoko):
// $ cd ../motoko
// $ nix-build -A js # Build and run tests
// cp -f /nix/store/...moc.js/bin/moc.min.js ../embed-motoko/versions/latest/moc.min.js
// cp -f /nix/store/...moc_interpreter.js/bin/moc_interpreter.min.js ../embed-motoko/versions/latest/moc_interpreter.min.js

const fs = require('fs');
const { resolve } = require('path');
const { exec } = require('child_process');

const motokoRepoPath =
    process.env.MOTOKO_REPO || resolve(__dirname, '../../motoko');

exec(`cd "${motokoRepoPath}" && nix-build -A js`, (err, stdout, stderr) => {
    if (err) {
        // return console.error(err.message || err);
        throw err;
    }
    console.error(stderr);
    console.log(stdout);

    const outputLines = stdout.split('\n').reverse();

    for (const target of ['didc', 'moc', 'moc_interpreter']) {
        const line = outputLines.find(
            (line) =>
                line.startsWith('/nix/store/') &&
                line.endsWith(`-${target}.js`),
        );
        if (!line) {
            throw new Error(`Could not find output directory for ${target}`);
        }
        fs.copyFileSync(
            `${line}/bin/${target}.min.js`,
            resolve(
                __dirname,
                `../compilers/latest/generated/${target}.min.js`,
            ),
        );
    }
});
