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
        const path = 'WriteRead.txt';
        const text = 'A\nB';
        mo.write(path, text);
        expect(mo.read(path)).toStrictEqual(text);
    });
});

describe('type checker', () => {
    test('basic example', () => {
        const path = 'Check.mo';
        mo.write(path, actor);
        expect(mo.check(path)).toStrictEqual([]);
    });

    test('long text literal', () => {
        const path = 'TextLiteral.mo';
        mo.write(path, `let s = "${'⛔'.repeat(20000)}"; s.size()`);
        expect(mo.check(path)).toStrictEqual([]);
    });
});
