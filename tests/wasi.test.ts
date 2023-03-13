import mo from '../src/versions/moc';
import { debugWASI } from '../src/debug';

describe('WASI', () => {
    test('basic WASI debug', async () => {
        const wasiFile = mo.file('DebugWASI.mo');
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

        expect(stdout).toStrictEqual('value = 5\n');

        // console.log(result.hexdump(0, 100));
    });
});
