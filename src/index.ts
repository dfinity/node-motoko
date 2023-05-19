import { CompilerNode, Node, simplifyAST } from './ast';
import { file } from './file';
import {
    Package,
    PackageInfo,
    fetchPackage,
    installPackages,
    validatePackage,
} from './package';
import { resolveLib, resolveMain } from './utils/resolveEntryPoint';

export type Motoko = ReturnType<typeof wrapMotoko>;

type Compiler = any; // TODO: generate from `js_of_ocaml`?

export type Diagnostic = {
    source: string;
    range: {
        start: { line: number; character: number };
        end: { line: number; character: number };
    };
    severity: number;
    code: string;
    category: string;
    message: string;
};

export type WasmMode = 'ic' | 'wasi';

export type Result = {
    value?: any;
    error: {
        message?: string;
    } | null;
};

export default function wrapMotoko(compiler: Compiler) {
    const version = compiler.version || '(unknown)';
    const debug = require('debug')(`motoko:${version}`);

    const invoke = (key: string, unwrap: boolean, args: any[]) => {
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
                          .map(({ message }: Diagnostic) => message)
                          .join('; ')
                    : '(no diagnostics)',
            );
        }
        return result.code;
    };

    // Function signatures for `mo.parseMotokoTyped()`
    type ParseMotokoTypedResult = { ast: Node; type: Node };
    function parseMotokoTyped(paths: string): ParseMotokoTypedResult;
    function parseMotokoTyped(paths: string[]): ParseMotokoTypedResult[];
    function parseMotokoTyped(
        paths: string | string[],
    ): ParseMotokoTypedResult | ParseMotokoTypedResult[] {
        if (typeof paths === 'string') {
            return mo.parseMotokoTyped([paths])[0];
        }
        return invoke('parseMotokoTyped', true, [paths]).map(
            ({ ast, typ }: { ast: CompilerNode; typ: CompilerNode }) => {
                return {
                    ast: simplifyAST(ast),
                    type: simplifyAST(typ),
                };
            },
        );
    }

    const mo = {
        version,
        compiler,
        file(path: string) {
            return file(mo, path);
        },
        read(path: string): string {
            return invoke('readFile', false, [path]);
        },
        write(path: string, content: string = '') {
            if (typeof content !== 'string') {
                throw new Error('Non-string file content');
            }
            debug('+file', path);
            invoke('saveFile', false, [path, content]);
        },
        rename(path: string, newPath: string) {
            invoke('renameFile', false, [path, newPath]);
        },
        delete(path: string) {
            debug('-file', path);
            invoke('removeFile', false, [path]);
        },
        list(directory: string): string[] {
            return invoke('readDir', false, [directory]);
        },
        async fetchPackage(name: string, info: string | PackageInfo) {
            if (!info) {
                throw new Error('Please specify both a name and source');
            }
            return fetchPackage(name, info);
        },
        async installPackages(packages: Record<string, string | PackageInfo>) {
            return installPackages(mo, packages);
        },
        loadPackage(pkg: Package) {
            debug('+package', pkg.name);
            mo.validatePackage(pkg);
            const directory = `.node-motoko/${pkg.name}/${pkg.version}`;
            Object.entries(pkg.files).forEach(([path, file]) => {
                mo.write(`${directory}/${path}`, file.content);
            });
            mo.usePackage(pkg.name, directory);
        },
        usePackage(name: string, directory: string) {
            debug('@package', name, directory);
            invoke('addPackage', false, [name, directory]);
        },
        clearPackages() {
            debug('-packages');
            invoke('clearPackage', false, []);
        },
        validatePackage(pkg: Package) {
            validatePackage(pkg);
        },
        setAliases(directory: string, aliases: Record<string, string>) {
            debug('aliases', directory, aliases);
            invoke('setCandidPath', false, [directory]);
            invoke('setActorAliases', false, [Object.entries(aliases)]);
        },
        setMetadata(values: string) {
            invoke('setPublicMetadata', false, [values]);
        },
        setRunStepLimit(limit: number) {
            invoke('setRunStepLimit', false, [limit]);
        },
        check(path: string): Diagnostic[] {
            const result = invoke('check', false, [path]);
            return result.diagnostics;
        },
        run(
            path: string,
            libPaths?: string[] | undefined,
        ): { stdout: string; stderr: string; result: Result } {
            return invoke('run', false, [libPaths || [], path]);
        },
        candid(path: string): string {
            return invoke('candid', true, [path]);
        },
        wasm(path: string, mode: WasmMode) {
            if (!mode) {
                mode = 'ic';
            } else if (mode !== 'ic' && mode !== 'wasi') {
                throw new Error(`Invalid WASM format: ${mode}`);
            }
            return invoke('compileWasm', true, [mode, path]);
        },
        parseCandid(content: string): object {
            return invoke('parseCandid', true, [content]);
        },
        parseMotoko(content: string): Node {
            const ast = invoke('parseMotoko', true, [content]);
            return simplifyAST(ast);
        },
        parseMotokoTyped,
        resolveMain(directory: string = ''): string | undefined {
            return resolveMain(mo, directory);
        },
        resolveLib(directory: string = ''): string | undefined {
            return resolveLib(mo, directory);
        },
    };
    // @ts-ignore
    mo.default = mo;
    return mo;
}
