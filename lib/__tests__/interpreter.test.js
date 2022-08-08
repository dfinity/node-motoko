'use strict';

const mo = require('../../interpreter');

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
