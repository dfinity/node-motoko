import { assert } from 'console';
import { fetchPackage } from '../src/package';

describe('fetchPackage', () => {
    test('fetches base library', async () => {
        const pkg = (await fetchPackage('dfinity/motoko-base/master/src'))!;
        expect(pkg).toBeTruthy();
        expect(pkg.name).toStrictEqual('motoko-base');
        expect(pkg.version).toStrictEqual('master');
    });
});
