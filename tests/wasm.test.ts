import { PocketIc, PocketIcServer } from '@dfinity/pic';
import mo from '../src/versions/moc';
import fs from 'fs';
import path from 'path';

interface TestActor {
    run: () => Promise<void>;
    sortAndRemoveDuplicates: (array: number[]) => Promise<number[]>;
}

describe('wasm', () => {
    let pocketIcServer: PocketIcServer;
    let pocketIc: PocketIc;

    beforeAll(async () => {
        mo.loadPackage(require('../packages/latest/base.json'));

        pocketIcServer = await PocketIcServer.start({
            showRuntimeLogs: false,
            showCanisterLogs: false,
        });
        pocketIc = await PocketIc.create(pocketIcServer.getUrl());
    }, 15000);

    afterAll(async () => {
        if (pocketIc) {
            await pocketIc.tearDown();
        }
        if (pocketIcServer) {
            await pocketIcServer.stop();
        }
    }, 15000);

    test('run test file', async () => {
        const actorSource = fs.readFileSync(
            path.join(__dirname, 'wasm.mo'),
            'utf-8',
        );

        const file = mo.file('test.mo');
        file.write(actorSource);
        const wasmResult = file.wasm('ic');
        expect(wasmResult?.wasm?.byteLength).toBeGreaterThan(0);

        const canisterId = await pocketIc.createCanister();
        await pocketIc.installCode({
            canisterId,
            wasm: wasmResult.wasm,
        });

        const actor: TestActor = pocketIc.createActor(({ IDL }) => {
            return IDL.Service({
                run: IDL.Func([], []),
                sortAndRemoveDuplicates: IDL.Func(
                    [IDL.Vec(IDL.Int)],
                    [IDL.Vec(IDL.Int)],
                ),
            });
        }, canisterId);

        // Test individual function call
        const sortResult = await actor.sortAndRemoveDuplicates([3, 2, 1, 2]);
        expect(sortResult).toEqual([1, 2, 3]);

        await expect(actor.run()).resolves.not.toThrow();
    }, 15000);
});
