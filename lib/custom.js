'use strict';

const { file } = require('./file');
const { /* findPackage, */ loadPackages } = require('./package');

module.exports = (compiler, version) => {
    const debug = require('debug')(version ? `motoko:${version}` : 'motoko');

    const invoke = (key, unwrap, args) => {
        if (!compiler) {
            throw new Error(
                'Please load a Motoko compiler before running this function',
            );
        }
        if (typeof compiler[key] !== 'function') {
            throw new Error(`Unknown compiler function: '${key}'`);
        }
        let result;
        try {
            result = compiler[key](...args);
        } catch (err) {
            if (err instanceof Error) {
                throw err;
            }
            throw new Error(
                `Unable to execute ${key}(${[...args]
                    .map((x) => typeof x)
                    .join(', ')}):\n${JSON.stringify(err)}`,
            );
        }
        if (!unwrap) {
            return result;
        }
        if (!result.code) {
            throw new Error(
                result.diagnostics
                    ? result.diagnostics
                          .map(({ message }) => message)
                          .join('; ')
                    : '(no diagnostics)',
            );
        }
        return result.code;
    };

    return {
        version,
        compiler,
        file,
        // findPackage,
        loadPackages,
        read(path) {
            return invoke('readFile', false, [path]);
        },
        write(path, content = '') {
            if (typeof content !== 'string') {
                throw new Error('Non-string file content');
            }
            debug('+file', path);
            invoke('saveFile', false, [path, content]);
        },
        rename(path, newPath) {
            invoke('renameFile', false, [path, newPath]);
        },
        delete(path) {
            debug('-file', path);
            invoke('removeFile', false, [path]);
        },
        list(directory) {
            return invoke('readDir', false, [directory]);
        },
        addPackage(name, directory) {
            debug('+package', name, directory);
            invoke('addPackage', false, [name, directory]);
        },
        clearPackages() {
            debug('-packages');
            invoke('clearPackage', false, []);
        },
        setAliases(aliases) {
            debug('aliases', aliases);
            invoke('setActorAliases', false, [Object.entries(aliases)]);
        },
        setMetadata(values) {
            invoke('setPublicMetadata', false, [values]);
        },
        check(path) {
            const result = invoke('check', false, [path]);
            return result.diagnostics;
        },
        run(path, libPaths) {
            return invoke('run', false, [libPaths || [], path]);
        },
        candid(path) {
            return invoke('candid', true, [path]);
        },
        wasm(path, mode) {
            if (!mode) {
                mode = 'ic';
            } else if (mode !== 'ic' && mode !== 'wasi') {
                throw new Error(`Invalid WASM format: ${mode}`);
            }
            return invoke('compileWasm', true, [mode, path]);
        },
        parseMotoko(content) {
            const ast = invoke('parseMotoko', true, [content]);
            return ast;
        },
        parseCandid(content) {
            const ast = invoke('parseCandid', true, [content]);
            return ast;
        },
    };
};
exports.default = exports;
