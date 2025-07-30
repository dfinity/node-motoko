import mo from '../src/versions/moc';

describe('entry point resolution', () => {
    mo.write('Main.mo', 'actor {}');
    mo.write('Lib.mo', 'module {}');

    mo.write('entry-point-1/main.mo', 'actor {}');
    mo.write('entry-point-1/lib.mo', 'module {}');
    mo.write('entry-point-1/file.txt', 'abc');

    mo.write('entry-point-2/Actor.mo', 'import a "a"; let a = b; actor {}');
    mo.write(
        'entry-point-2/ActorClass.mo',
        'import a "a"; let a = b; actor class() {}',
    );
    mo.write('entry-point-2/Module.mo', 'import a "a"; let a = b; module {}');

    mo.write('entry-point-3/ActorClass.mo', 'actor class() {}');
    mo.write('entry-point-3/Module.mo', 'module {}');

    mo.write('entry-point-4/Only.mo', 'module {}');
    mo.write('entry-point-4/File.txt', 'abc');
    mo.write('entry-point-4/dir/Nested.mo', 'module {}');

    test('main -> Main.mo', async () =>
        expect(mo.resolveMain()).toStrictEqual('Main.mo'));

    test('main -> case insensitive', async () =>
        expect(mo.resolveMain('entry-point-1')).toStrictEqual('main.mo'));

    // test('main -> only actor', async () =>
    //     expect(mo.resolveMain('entry-point-2')).toStrictEqual('Actor.mo'));

    // test('main -> only actor class', async () =>
    //     expect(mo.resolveMain('entry-point-3')).toStrictEqual('ActorClass.mo'));

    test('main -> only Motoko file', async () =>
        expect(mo.resolveMain('entry-point-4')).toStrictEqual('Only.mo'));

    test('lib -> Lib.mo', async () =>
        expect(mo.resolveLib()).toStrictEqual('Lib.mo'));

    test('lib -> case insensitive', async () =>
        expect(mo.resolveLib('entry-point-1')).toStrictEqual('lib.mo'));

    // test('lib -> only module', async () =>
    //     expect(mo.resolveLib('entry-point-2')).toStrictEqual('Module.mo'));

    test('lib -> only Motoko file', async () =>
        expect(mo.resolveLib('entry-point-4')).toStrictEqual('Only.mo'));
});
