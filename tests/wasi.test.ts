import mo from '../src/versions/moc';

describe('WASI', () => {
    test('WASI debug', () => {
        // await mo.installPackages({ base: 'dfinity/motoko-base/master/src' });
        mo.loadPackage(require('../packages/latest/base.json'));

        const file = mo.file('Test.mo');
        file.write('import Debug "mo:base/Debug"; Debug.print(debug_show 123)');
        file.run();
    });
});
