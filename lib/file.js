'use strict';

function getValidPath(path) {
    if (typeof path !== 'string') {
        throw new Error('File path must be a string');
    }
    if (path.startsWith('/')) {
        path = path.slice(1);
    }
    if (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return path;
}

exports.file = (mo, path) => {
    path = getValidPath(path);
    const result = {
        get path() {
            return path;
        },
        // file(subPath) {
        //     subPath = getValidPath(subPath);
        //     return exports.file(`${path}/${subPath}`);
        // },
        clone() {
            return exports.file(path);
        },
        read() {
            return mo.read(path);
        },
        write(content) {
            return mo.write(path, content);
        },
        rename(newPath) {
            let result = mo.rename(path, newPath);
            path = newPath;
            return result;
        },
        delete() {
            return mo.delete(path);
        },
        list() {
            return mo.list(path);
        },
        check() {
            return mo.check(path, ...args);
        },
        run() {
            return mo.run(path);
        },
        candid() {
            return mo.candid(path);
        },
        wasm(mode) {
            return mo.wasm(path, mode);
        },
        parseMotoko() {
            return mo.parseMotoko(result.read());
        },
        parseCandid() {
            return mo.parseCandid(result.read());
        },
    };
    return result;
};
