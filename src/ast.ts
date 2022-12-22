export type CompilerAST = CompilerAST[] | CompilerNode | string | null;
export type CompilerSpan = { name: 'Pos'; args: [string, string, string] };

export interface CompilerNode {
    name: string;
    args: CompilerAST[];
}

export type Span = [number, number];
export type AST = AST[] | Node | string | null;

export interface Source {
    file: string;
    start: Span;
    end: Span;
}

export interface Node extends Partial<Source> {
    parent?: Node | undefined;
    name: string;
    type?: string;
    doc?: string;
    declaration?: Source;
    args?: AST[];
}

export function simplifyAST(ast: CompilerNode, parent?: Node | undefined): Node;
export function simplifyAST(
    ast: CompilerAST[],
    parent?: Node | undefined,
): AST[];
export function simplifyAST<T extends CompilerAST>(
    ast: T,
    parent?: Node | undefined,
): T;
export function simplifyAST(ast: CompilerAST, parent?: Node | undefined): AST {
    if (Array.isArray(ast)) {
        return ast.map((a) => simplifyAST(a, parent));
    }
    if (typeof ast !== 'object') {
        return ast;
    }
    if (ast.name === '@') {
        const [start, end, subAst] = ast.args as [
            CompilerSpan,
            CompilerSpan,
            CompilerAST,
        ];
        const node: Node = {
            ...(typeof subAst === 'string'
                ? { name: subAst }
                : simplifyAST(subAst as any as CompilerNode, parent)),
            start: [+start.args[1], +start.args[2]],
            end: [+end.args[1], +end.args[2]],
        };
        const file = start.args[0];
        if (file) {
            node.file = file;
        }
        return node;
    }
    if (ast.name === ':') {
        const [typeAst, type] = ast.args as [CompilerAST, string];
        return {
            ...(typeof typeAst === 'string'
                ? { name: typeAst }
                : simplifyAST(typeAst, parent)),
            type,
        };
    }
    if (ast.name === '*') {
        const [doc, docAst] = ast.args as [string, CompilerAST];
        return {
            ...(typeof docAst === 'string'
                ? { name: docAst }
                : simplifyAST(docAst, parent)),
            doc,
        };
    }
    const node: Node = {
        name: ast.name,
    };
    Object.defineProperty(node, 'parent', {
        value: parent,
        enumerable: false,
    });
    node.args = simplifyAST(ast.args, node);
    return node;
}
