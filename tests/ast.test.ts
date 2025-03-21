import mo from '../src/versions/moc';
import { Node, asNode } from '../src/ast';
import { Scope } from '../src/file';
import fs from 'fs';
import path from 'path';

const actorSource = `
import { print } "mo:base/Debug";

actor Main {
    public query func test() : async Nat {
        123
    }
};
`;

function loadTopAndBottom() {
    const root = path.join(__dirname, 'cache');
    const bottom = mo.file('Bottom.mo');
    bottom.write(fs.readFileSync(path.join(root, 'Bottom.mo'), 'utf-8'));
    const top = mo.file('Top.mo');
    top.write(fs.readFileSync(path.join(root, 'Top.mo'), 'utf-8'));
    return [top, bottom];
}

describe('ast', () => {
    beforeAll(() => {
        mo.loadPackage(require('../packages/latest/base.json'));
    });

    test('parent property in expression', async () => {
        const ast = mo.parseMotoko('let x = 0; x');
        const args = ast.args!.filter(
            (arg) => arg && typeof arg === 'object' && !Array.isArray(arg),
        ) as Node[];
        expect(args).toHaveLength(2);
        args.forEach((node) => {
            expect(node.parent).toBe(ast);
        });
    });

    test('parent property in typed AST', async () => {
        const file = mo.file('AST.mo');
        file.write(actorSource);

        const check = (node: Node) => {
            for (const arg of node.args || []) {
                const argNode = asNode(arg);
                if (argNode) {
                    expect(argNode.parent).toBe(node);
                    check(argNode);
                }
            }
        };
        const node = asNode(file.parseMotokoTyped(new Map<string, Scope>())[0].ast);
        expect(node).toBeTruthy();
        check(node!);
    });

    test('unchanged file should have equal caches', async () => {
        const file = mo.file('AST.mo');
        file.write(actorSource);
        const [prog0, cache0] = file.parseMotokoTyped(new Map<string, Scope>());
        expect(prog0.ast).toBeTruthy();
        expect(prog0.immediateImports).toEqual(
            ['.node-motoko/base/moc-0.14.1/Debug.mo'],
        );
        expect(Array.from(cache0.keys())).toEqual(
            ['.node-motoko/base/moc-0.14.1/Debug.mo', '@prim'],
        );

        const [prog1, cache1] = file.parseMotokoTyped(cache0);
        expect(cache1).toEqual(cache0);
        expect(prog1.ast).toStrictEqual(prog0.ast);
        expect(prog1.immediateImports).toEqual(prog0.immediateImports);
    });

    test('deleting from cache has equal new cache', async () => {
        const file = mo.file('AST.mo');
        file.write(actorSource);
        const [prog0, cache0] = file.parseMotokoTyped(new Map<string, Scope>());

        // Delete cache, ensure it works
        const cache0Clone = new Map<string, Scope>(cache0);
        cache0.delete('AST.mo');
        const [prog1, cache1] = file.parseMotokoTyped(cache0);
        expect(cache1).toEqual(cache0Clone);
        expect(prog1.ast).toBeTruthy();
        expect(prog1.immediateImports).toEqual(prog0.immediateImports);
        expect(prog1.ast).toStrictEqual(prog0.ast);
    });

    test('changed file should have different caches', async () => {
        const file = mo.file('AST.mo');
        file.write(actorSource);
        const [prog0, cache0] = file.parseMotokoTyped(new Map<string, Scope>());

        // Remove import, ensure caches are different
        const actorSource1 = actorSource.substring(1 + actorSource.indexOf(';'));
        file.write(actorSource1);

        const cache0Clone = new Map<string, Scope>(cache0);
        cache0.clear();
        const [prog1, cache1] = file.parseMotokoTyped(cache0);
        expect(Array.from(cache1.keys())).toEqual([]);
        expect(prog1.ast).toBeTruthy();
        expect(prog1.immediateImports).toEqual([]);
        expect(cache1).not.toStrictEqual(cache0Clone);
        expect(prog1.ast).not.toStrictEqual(prog0.ast);
    });

    test('invalidating an unchanged reference without invalidating the file should be invalid', async () => {
        const [top, _bottom] = loadTopAndBottom();

        const [prog0, cache0] = top.parseMotokoTyped(new Map<string, Scope>());
        expect(prog0.ast).toBeTruthy();
        expect(prog0.immediateImports).toEqual(['Bottom.mo']);
        expect(Array.from(cache0.keys())).toEqual(['Bottom.mo']);

        // Remove bottom and ensure cache is NOT valid (because Top is
        // invalidated)
        const cache0Clone = new Map<string, Scope>(cache0);
        cache0.delete('Bottom.mo');
        const [prog1, cache1] = top.parseMotokoTyped(cache0);
        expect(cache1).toStrictEqual(cache0Clone);
        expect(Array.from(cache1.keys())).toEqual(['Bottom.mo']);
        expect(prog1.ast).toBeTruthy();
        expect(prog1.immediateImports).toEqual(prog0.immediateImports);
        expect(prog1.ast).toStrictEqual(prog0.ast);
    });

    test('invalidating an unchanged file and reference should yield the same scope', async () => {
        const [top, _bottom] = loadTopAndBottom();

        // Remove top and bottom and ensure cache is valid
        const [prog0, cache0] = top.parseMotokoTyped(new Map<string, Scope>());
        const cache0Clone = new Map<string, Scope>(cache0);
        cache0.delete('Bottom.mo');
        cache0.delete('Top.mo');
        const [prog1, cache1] = top.parseMotokoTyped(cache0);
        expect(cache1).toStrictEqual(cache0Clone);
        expect(Array.from(cache1.keys())).toEqual(['Bottom.mo']);
        expect(prog1.ast).toBeTruthy();
        expect(prog1.immediateImports).toEqual(prog0.immediateImports);
        expect(prog1.ast).toStrictEqual(prog0.ast);
    });

    test('load bottom after top should work', async () => {
        const [top, bottom] = loadTopAndBottom();

        const [_progTop, cacheTop] = top.parseMotokoTyped(new Map<string, Scope>());
        const [progBottom, cacheBottom] = bottom.parseMotokoTyped(cacheTop);
        expect(Array.from(cacheBottom.keys())).toEqual(['Bottom.mo']);
        expect(cacheBottom.get('Top.mo')).toStrictEqual(cacheTop.get('Top.mo'));
        expect(cacheBottom.get('Bottom.mo')).toStrictEqual(cacheTop.get('Bottom.mo'));
        expect(progBottom.ast).toBeTruthy();
        expect(progBottom.immediateImports).toEqual([]);
    });

    test('load top after bottom should work', async () => {
        const [top, bottom] = loadTopAndBottom();

        const [progBottom, cacheBottom] = bottom.parseMotokoTyped(new Map<string, Scope>());
        expect(Array.from(cacheBottom.keys())).toEqual([]);
        expect(progBottom.ast).toBeTruthy();
        expect(progBottom.immediateImports).toEqual([]);

        const [progTop, cacheTop] = top.parseMotokoTyped(cacheBottom);
        expect(Array.from(cacheTop.keys())).toEqual(['Bottom.mo']);
        expect(cacheTop.get('Bottom.mo')).not.toStrictEqual(cacheBottom.get('Bottom.mo'));
        expect(progTop.ast).toBeTruthy();
        expect(progTop.immediateImports).toEqual(['Bottom.mo']);
    });

    test('immediate imports for top', async () => {
        const [top, _bottom] = loadTopAndBottom();

        const { ast, immediateImports } = top.parseMotokoWithDeps();
        expect(ast).toBeTruthy();
        expect(immediateImports).toEqual(['Bottom.mo']);
    });

    test('immediate imports for bottom', async () => {
        const [_top, bottom] = loadTopAndBottom();

        const { ast, immediateImports } = bottom.parseMotokoWithDeps();
        expect(ast).toBeTruthy();
        expect(immediateImports).toEqual([]);
    });
});
