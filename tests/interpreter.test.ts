import mo from '../src/versions/interpreter';

// Load core package
mo.loadPackage(require('../packages/latest/core.json'));

const testMotoko = (source: string) => {
    const file = mo.file('__test__.mo');
    file.write(source);
    return file.run();
};

describe('run', () => {
    test('basic example', () => {
        const path = '__test__basic.mo';
        mo.write(path, 'let x = 1 + 1; x');
        const result = mo.run(path);
        expect(result).toStrictEqual({
            result: {
                error: null,
            },
            stdout: '2 : Nat\n',
            stderr: '',
        });
    });

    test('loop with many iterations', () => {
        const count = '10_000';
        const { stdout } = testMotoko(`
            import Iter "mo:core/Iter";
            var x = 0;
            for (i in Iter.range(0, ${count} - 1)) {
                x += 1;
            };
            x
        `);
        expect(stdout).toEqual(`${count} : Nat\n`);
    });

    test('Random module', () => {
        const { stdout, result } = testMotoko(`
            import Random "mo:core/Random";
            Random.blob()
        `);
        expect(stdout).toMatch(/"[\\0-9A-Z]+" :\s+async<\$top-level> Blob/);
        expect(result).toStrictEqual({
            error: null,
        });
    });

    test('error handling', () => {
        const { stderr, result } = testMotoko(`
            1 / 0
        `);
        expect(stderr).toMatch(/arithmetic overflow/);
        expect(result).toStrictEqual({
            error: {},
        });
    });

    test('long string literal', () => {
        const { stdout, result } = testMotoko(`
            let s = "${'⛔'.repeat(20000)}";
            s.size()
        `);
        expect(stdout).toStrictEqual('20_000 : Nat\n');
    });

    test('actor value', () => {
        const { stdout } = testMotoko(
            `persistent actor { public func abc() : async Nat { 123 }; }`,
        );
        expect(stdout).toStrictEqual(
            '`ys6dh-5cjiq-5dc` : actor {abc : shared () -> async Nat}\n',
        );
    });

    test('output charset', () => {
        const { stdout } = testMotoko(
            `import {debugPrint} "mo:prim"; debugPrint("smażone");`,
        );
        expect(stdout).toStrictEqual(
            'smażone\n() : ()\n',
        );
    });
});
