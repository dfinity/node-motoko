'use strict';

const debug = require('debug')('motoko');

const { Motoko } = require('./generated/moc');
const { /* resolvePackage, */ loadPackages } = require('./package');

const invoke = (key, unwrap, args) => {
    if (typeof Motoko[key] !== 'function') {
        throw new Error(`Unknown compiler function: '${key}'`);
    }
    let result;
    try {
        result = Motoko[key](...args);
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
                ? result.diagnostics.map(({ message }) => message).join('; ')
                : '(no diagnostics)',
        );
    }
    return result.code;
};

module.exports = {
    Motoko,
    // resolvePackage,
    loadPackages,
    addFile(file, content = '') {
        if (typeof content !== 'string') {
            throw new Error('Non-string file content');
        }
        debug('+file', file);
        invoke('saveFile', false, [file, content]);
    },
    removeFile(file) {
        debug('-file', file);
        invoke('removeFile', false, [file, content]);
    },
    listFiles(directory) {
        return invoke('readDir', false, [directory]);
    },
    addPackage(name, file) {
        debug('+package', name, file);
        invoke('addPackage', false, [name, file]);
    },
    clearPackages() {
        debug('-packages');
        invoke('clearPackage', false, []);
    },
    check(file) {
        const result = invoke('check', false, [file]);
        return result.diagnostics;
    },
    run(file, libFiles) {
        return invoke('run', false, [libFiles || [], file]);
    },
    candid(file) {
        return invoke('candid', true, [file]);
    },
    wasm(mode, file) {
        return invoke('compileWasm', true, [mode, file]);
    },
    parse(content) {
        const ast = invoke('parse', true, [content]);
        return ast;
    },
    parseCandid(content) {
        const ast = invoke('parseCandid', true, [content]);
        return ast;
    },
};
exports.default = exports;
