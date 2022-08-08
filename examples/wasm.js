'use strict';

const mo = require('../lib');

const icFile = mo.file('IC.mo');

icFile.write(`
actor {
    var value: Int = 0;

    public func get() : async Int {
        value
    };

    public func inc() {
        value += 1
    };
};
`);

const ic = icFile.wasm('ic');
console.log('IC output:', ic);

const wasiFile = mo.file('WASI.mo');
wasiFile.write(`
module {
    public let value = 5;
};
`);

const wasi = wasiFile.wasm('wasi');
console.log('WASI output:', wasi);
