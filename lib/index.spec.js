'use strict';

const mo = require('.');

const actor = `
actor Main {
    public func test() : async Nat {
        123
    }
}
`;

describe('check', () => {
    test('works for a basic example', () => {
        const file = 'test__check__.mo';
        mo.addFile(file, actor);
        expect(mo.check(file)).toStrictEqual([]);
    });
});

describe('run', () => {
    test('works for a basic example', () => {
        const file = 'test__run__.mo';
        mo.addFile(file, 'let x = 1 + 1; x');
        expect(mo.run(file)).toStrictEqual({
            result: 0,
            stdout: '2 : Nat\n',
            stderr: '',
        });
    });
});
