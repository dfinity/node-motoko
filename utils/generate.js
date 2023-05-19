'use strict';

const fs = require('fs');
const { join, resolve, basename } = require('path');
const { exec } = require('child_process');

// Generate Motoko compiler bindings

const motokoRepoPath =
    process.env.MOTOKO_REPO || resolve(__dirname, '../../motoko');

exec(`cd "${motokoRepoPath}" && nix-build -A js`, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        process.exit(1);
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
        if (fs.existsSync(dest)) {
            fs.unlinkSync(dest);
        }
        fs.copyFileSync(`${line}/bin/${target}.min.js`, dest);
    }
});

// Download base library

const { fetchPackage } = require('../lib/package');

(async () => {
    const basePackage = await fetchPackage(
        'base',
        'dfinity/motoko-base/master/src',
    );
    if (
        basePackage.version !== 'master' ||
        !Object.entries(basePackage.files).length
    ) {
        throw new Error('Unexpected package format');
    }
    fs.writeFileSync(
        __dirname + '/../packages/latest/base.json',
        JSON.stringify(basePackage),
    );
})().catch((err) => {
    console.error(err);
    process.exit(1);
});

// Update error code explanations

const errorCodes = {};

const errorCodesPath = join(motokoRepoPath, 'src/lang_utils/error_codes');
fs.readdirSync(errorCodesPath).forEach((file) => {
    const suffix = '.md';
    if (!file.endsWith(suffix)) {
        throw new Error(
            `Unexpected extension for file: ${file} (expected '${suffix}')`,
        );
    }
    const content = fs.readFileSync(join(errorCodesPath, file), 'utf8');
    errorCodes[basename(file, suffix)] = content;
});

fs.writeFileSync(
    resolve(__dirname, '../contrib/generated/errorCodes.json'),
    JSON.stringify(errorCodes),
);
