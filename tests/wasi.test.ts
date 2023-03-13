import mo from '../src/versions/moc';
import { debugWASI } from '../src/wasi';

describe('WASI', () => {
    test('basic WASI debug', async () => {
        const wasiFile = mo.file('DebugWASI.mo');
        wasiFile.write(`
        import { debugPrint = print } "mo:⛔";

        module Interface {
            public let value = 5;
        };

        print("value = " # debug_show Interface.value);
        `);

        const { wasm } = wasiFile.wasm('wasi');

        let stdout = '';
        await debugWASI(wasm, {
            onDebugPrint(data: string) {
                process.stdout.write(data);
                stdout += data;
            },
        });

        expect(stdout).toStrictEqual('value = 5\n');
    });
});
