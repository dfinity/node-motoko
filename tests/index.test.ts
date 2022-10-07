import mo from '../src/versions/moc';

const actor = `
actor Main {
    public func test() : async Nat {
        123
    }
}
`;

describe('virtual file system I/O', () => {
    test('write -> read', () => {
        const path = 'test__write_read__.txt';
        const text = 'A\nB';
        mo.write(path, text);
        expect(mo.read(path)).toStrictEqual(text);
    });
});

describe('check', () => {
    test('works for a basic example', () => {
        const path = 'test__check__.mo';
        mo.write(path, actor);
        expect(mo.check(path)).toStrictEqual([]);
    });
});

describe('deterministic', () => {
    test('results in the same module_hash', () => {
        const path = 'test__check__.mo';
        mo.write(path, actor);
        expect(mo.check(path)).toStrictEqual([]);

        const compile = (code : any) => {
            let f = mo.file("IC.mo")
            f.write(code)
            return f.wasm("ic");
        }
        
        let a = compile(actor);
        let b = compile(actor);
        expect(a.wasm).toEqual(b.wasm);

    });
});

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
});
