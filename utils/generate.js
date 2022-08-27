'use strict';

const fs = require('fs');
const { resolve } = require('path');
const { exec } = require('child_process');

const motokoRepoPath =
    process.env.MOTOKO_REPO || resolve(__dirname, '../../motoko');

exec(`cd "${motokoRepoPath}" && nix-build -A js`, (err, stdout, stderr) => {
    if (err) {
        throw err;
    }
    console.log(stdout);
    console.error(stderr);

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
        const dest = resolve(__dirname, `../versions/latest/${target}.min.js`);
        fs.unlinkSync(dest);
        fs.copyFileSync(`${line}/bin/${target}.min.js`, dest);
    }
});
