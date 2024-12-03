'use strict';

const fs = require('fs/promises');
const { join, resolve, basename } = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const { fetchPackage } = require('../lib/package');

// Generate Motoko compiler bindings

const motokoRepoPath =
    process.env.MOTOKO_REPO || resolve(__dirname, '../../motoko');

// exec(`cd "${motokoRepoPath}" && nix-build -A js`, (err, stdout, stderr) => {
//     if (err) {
//         console.error(err);
//         process.exit(1);
//     }
//     console.log(stdout);
//     console.error(stderr);

//     const outputLines = stdout.split('\n').reverse();

//     for (const target of ['didc', 'moc', 'moc_interpreter']) {
//         const line = outputLines.find(
//             (line) =>
//                 line.startsWith('/nix/store/') &&
//                 line.endsWith(`-${target}.js`),
//         );
//         if (!line) {
//             throw new Error(`Could not find output directory for ${target}`);
//         }
//         const dest = resolve(__dirname, `../versions/latest/${target}.min.js`);
//         if (fs.existsSync(dest)) {
//             fs.unlinkSync(dest);
//         }
//         fs.copyFileSync(`${line}/bin/${target}.min.js`, dest);
//     }
// });

const version = process.argv[2];
if (!/\d+\.\d+\.\d+/.test(version)) {
    console.error(
        `Please pass a valid Motoko version to the 'generate' script. Received ${version}`,
    );
    process.exit(1);
}

(async () => {
    console.log('Downloading `moc.js` files...');
    await fs.writeFile(
        resolve(__dirname, `../versions/latest/moc.min.js`),
        (
            await axios.get(
                `https://github.com/dfinity/motoko/releases/download/${version}/moc-${version}.js`,
            )
        ).data,
    );
    await fs.writeFile(
        resolve(__dirname, `../versions/latest/moc_interpreter.min.js`),
        (
            await axios.get(
                `https://github.com/dfinity/motoko/releases/download/${version}/moc-interpreter-${version}.js`,
            )
        ).data,
    );

    // TODO: download latest version of `didc.js`

    console.log('Downloading base library...');
    const basePackage = await fetchPackage(
        'base',
        `dfinity/motoko-base/moc-${version}/src`,
    );
    if (
        basePackage.version !== `moc-${version}` ||
        !Object.entries(basePackage.files).length
    ) {
        throw new Error('Unexpected package format');
    }
    await fs.writeFile(
        __dirname + '/../packages/latest/base.json',
        JSON.stringify(basePackage),
    );

    console.log('Updating error code explanations...');
    const errorCodes = {};
    const errorCodesPath = join(motokoRepoPath, 'src/lang_utils/error_codes');
    await Promise.all(
        (
            await fs.readdir(errorCodesPath)
        ).map(async (file) => {
            const suffix = '.md';
            if (!file.endsWith(suffix)) {
                throw new Error(
                    `Unexpected extension for file: ${file} (expected '${suffix}')`,
                );
            }
            const content = await fs.readFile(
                join(errorCodesPath, file),
                'utf8',
            );
            errorCodes[basename(file, suffix)] = content;
        }),
    );

    await fs.writeFile(
        resolve(__dirname, '../contrib/generated/errorCodes.json'),
        JSON.stringify(errorCodes),
    );

    console.log('Completed.');
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
