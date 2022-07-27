const debug = require('debug')('motoko');

const { Motoko } = require('./generated/moc');
const { loadPackage } = require('./package');

const invoke = (key, unwrap, args) => {
    let result;
    try {
        result = Motoko[key](...args);
    } catch (e) {
        throw new Error(
            `Unable to execute ${key}(${[...args]
                .map((x) => typeof x)
                .join(', ')}):\n${JSON.stringify(e)}`,
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

// for (const key of Object.keys(Motoko)) {
//     if (typeof Motoko[key] === 'function') {
//         const fn = Motoko[key];
//         Motoko[key] = (...args) => {
//             debug(key, ...args);
//             fn(...args);
//         };
//     }
// }

module.exports = {
    Motoko,
    loadPackage,
    addFile(path, content) {
        debug('+file', path);
        try {
            // TEMP
            invoke('saveFile', false, [path, content]);
            return true;
        } catch (e) {
            return false;
        }
    },
    removeFile(path) {
        debug('-file', path);
        invoke('removeFile', false, [path, content]);
    },
    getFiles(path) {
        const files = invoke('readDir', false, [path]);

        return files;
    },
    addPackage(name, path) {
        debug('+package', name, path);
        invoke('addPackage', false, [name, path]);
    },
    clearPackages() {
        debug('-packages');
        invoke('clearPackage', false, []);
    },
    parse(content) {
        const ast = invoke('parse', true, [content]);
        return ast;
    },
    parseCandid(content) {
        const ast = invoke('parseCandid', true, [content]);
        return ast;
    },
    candid(path) {
        return invoke('candid', true, [path]);
    },
};
