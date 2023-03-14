import { existsSync, readFileSync } from 'fs';
import { debugWASI } from '../src/debug';
import mo from '../src/versions/moc';
import { join } from 'path';

describe('WASI debug', () => {
    test('debug in memory', async () => {
        const wasiFile = mo.file('MemoryWASI.mo');
        wasiFile.write(`
            import { debugPrint = print } "mo:⛔";
            module Module {
                public let value = 5;
            };
            print("value = " # debug_show Module.value);
        `);

        let stdout = '';
        const result = await wasiFile.debug({
            onStdout(data: string) {
                process.stdout.write(data);
                stdout += data;
            },
        });
        expect(stdout).toStrictEqual('value = 5\n');

        // console.log(result.hexdump(0, 100));
    });

    // Run additional test when `./wasm/Debug.test.wasm` exists
    const wasmFile = join(__dirname, 'wasm/Debug.test.wasm');
    (existsSync(wasmFile) ? test : test.skip)('debug from file', async () => {
        const wasm = readFileSync(wasmFile);
        let stdout = '';
        const result = await debugWASI(wasm, {
            onStdout(data: string) {
                process.stdout.write(data);
                stdout += data;
            },
        });
        expect(stdout).toStrictEqual('value = 123\n');
    });
});
