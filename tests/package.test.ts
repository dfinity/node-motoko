import mo from '../src/versions/moc';

describe('fetchPackage', () => {
    // test('fetch base library', async () => {
    //     const pkg = (await mo.fetchPackage(
    //         'base',
    //         'dfinity/motoko-base/master/src',
    //     ))!;
    //     expect(pkg).toBeTruthy();
    //     expect(pkg.name).toStrictEqual('base');
    //     expect(pkg.version).toStrictEqual('master');
    //     expect(Object.keys(pkg.files)).toContain('Debug.mo');
    //     // expect file in package
    // });

    test('load base library', () => {
        // await mo.installPackages({ base: 'dfinity/motoko-base/master/src' });
        mo.loadPackage(require('../packages/latest/base.json'));

        const file = mo.file('Test.mo');
        file.write('import Debug "mo:base/Debug"; Debug.print(debug_show 123)');
        file.run();
    });
});
