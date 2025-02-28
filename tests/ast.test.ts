import mo from '../src/versions/moc';
import { Node, asNode, AST } from '../src/ast';

const actorSource = `
import { print } "mo:base/Debug";

actor Main {
    public query func test() : async Nat {
        123
    }
};
`;

describe('ast', () => {
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
        mo.loadPackage(require('../packages/latest/base.json'));
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
});
