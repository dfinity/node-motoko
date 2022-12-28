import { Motoko, WasmMode } from '.';

function getValidPath(path: string): string {
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

export type MotokoFile = ReturnType<typeof file>;

export const file = (mo: Motoko, path: string) => {
    path = getValidPath(path);
    const result = {
        get path(): string {
            return path;
        },
        set path(newPath) {
            path = newPath;
        },
        // file(subPath) {
        //     subPath = getValidPath(subPath);
        //     return exports.file(`${path}/${subPath}`);
        // },
        clone() {
            return exports.file(path);
        },
        read(): string {
            return mo.read(path);
        },
        write(content: string) {
            return mo.write(path, content);
        },
        rename(newPath: string) {
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
            return mo.check(path);
        },
        run() {
            return mo.run(path);
        },
        candid() {
            return mo.candid(path);
        },
        wasm(mode: WasmMode) {
            return mo.wasm(path, mode);
        },
        parseCandid() {
            return mo.parseCandid(result.read());
        },
        parseMotoko() {
            return mo.parseMotoko(result.read());
        },
        parseMotokoTyped() {
            return mo.parseMotokoTyped(path);
        },
    };
    return result;
};
