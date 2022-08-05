const { file } = require('.');

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

exports.file = (path) => {
    path = getValidPath(path);
    const mo = require('.');
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
            mo.write(path, content);
            return this;
        },
        rename(newPath) {
            mo.rename(path, newPath);
            path = newPath;
            return this;
        },
        delete() {
            mo.delete(path);
            return this;
        },
        list() {
            return mo.list(path);
        },
        check() {
            return mo.check(path, ...args);
        },
        run() {
            return mo.run();
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
