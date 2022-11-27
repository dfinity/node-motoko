import mo from '../src/versions/interpreter';

mo.loadPackage(require('../packages/latest/base.json'));

describe('run', () => {
    test('works for a basic example', () => {
        const path = 'test__run__.mo';
        mo.write(path, 'let x = 1 + 1; x');
        expect(mo.run(path)).toStrictEqual({
            result: 0,
            stdout: '2 : Nat\n',
            stderr: '',
        });
    });

    test('works for a loop with many iterations', () => {
        const count = '10_000';
        const file = mo.file('Main.mo');
        file.write(`
            import Iter "mo:base/Iter";
            var x = 0;
            for (i in Iter.range(0, ${count} - 1)) {
                x += 1;
            };
            x
        `);
        const { stdout, stderr } = file.run();
        if (stderr) {
            console.error(stderr);
        }
        expect(stdout).toEqual(`${count} : Nat\n`);
    });
});
