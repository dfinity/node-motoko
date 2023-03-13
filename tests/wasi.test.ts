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

        const wasiResult = wasiFile.wasm('wasi');
        // console.log('WASI:', wasiResult);

        const { wasm } = wasiResult;

        await debugWASI(wasm);
    });
});
