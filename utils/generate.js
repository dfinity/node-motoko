'use strict';

const fs = require('fs/promises');
const { join, resolve, basename } = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const { fetchPackage } = require('../lib/package');

const version = process.argv[2];
const isLocalBuild = version === 'local';

if (!isLocalBuild && !/\d+\.\d+\.\d+/.test(version)) {
    console.error(
        `Please pass a valid Motoko version or 'local' to the 'generate' script. Received ${version}`,
    );
    process.exit(1);
}

const motokoRepoPath =
    process.env.MOTOKO_REPO || resolve(__dirname, '../../motoko/');

(async () => {
    async function copyFile(buildDir, destDir, sourceFileName, destFileName) {
        const sourcePath = join(buildDir, sourceFileName);
        const destPath = join(destDir, destFileName);
        await fs.unlink(destPath);
        await fs.copyFile(sourcePath, destPath);
    }

    if (isLocalBuild) {
        console.log('Building Motoko from local repository...');
        try {
            execSync('nix develop -c make -C src moc.js moc_interpreter.js', {
                cwd: motokoRepoPath,
                stdio: 'inherit',
            });

            console.log('Copying `moc.js` and `moc_interpreter.js` files...');
            const buildDir = join(motokoRepoPath, 'src/_build/default/js/');
            const destDir = resolve(__dirname, '../versions/latest/');

            await copyFile(buildDir, destDir, 'moc_js.bc.js', 'moc.min.js');
            await copyFile(
                buildDir,
                destDir,
                'moc_interpreter.bc.js',
                'moc_interpreter.min.js',
            );

            console.log('Local `moc.js` and `moc_interpreter.js` updated.');
            console.log('Skipping base library for local build.'); // Future work: Use local base lib repo
        } catch (err) {
            console.error('Error during local build or file copying:');
            console.error(err);
            process.exit(1);
        }
    } else {
        // This block executes for versioned (non-local) builds
        console.log(
            `Preparing to download resources for Motoko version ${version}...`,
        );
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
    }

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
