import { existsSync, readFileSync } from 'fs';
import { debugWASI } from '../src/debug';
import mo from '../src/versions/moc';
import { join } from 'path';

describe('WASI debug', () => {
    const expectedOutput =
        '(666, true, "hello", "\\FF\\FF\\68\\65\\6C\\6C\\6F", 66, -66, (666, true, "hello", "\\FF\\FF\\68\\65\\6C\\6C\\6F", 66, -66, "abcdefghijklmnopqrstuvwxyz", {fa = 666; fb = "hello"; fc = "state"}, null, ?null, ?(?null), ?666, ?(?666), #fa, #fb("data"), 36_893_488_147_419_103_231, +36_893_488_147_419_103_232, -36_893_488_147_419_103_232))\n';

    test('debug in memory', async () => {
        const wasiFile = mo.file('MemoryWASI.mo');
        wasiFile.write(
            readFileSync(join(__dirname, 'wasm/Debug.test.mo'), 'utf8'),
        );

        let stdout = '';
        const result = await wasiFile.debug({
            onStdout(data: string) {
                process.stdout.write(data);
                stdout += data;
            },
        });
        expect(stdout).toStrictEqual(expectedOutput);

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
        expect(stdout).toStrictEqual(expectedOutput);
    });
});
