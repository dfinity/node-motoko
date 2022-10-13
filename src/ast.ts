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
    name: string;
    type?: string;
    declaration?: Source;
    args?: AST[];
}

// export type TypeAST = AST[] | Node | string | number | null;
// export type TypeNode = {
//     name: string;
//     args: TypeAST[];
// };

export function simplifyAST(ast: CompilerNode): Node;
export function simplifyAST(ast: CompilerAST[]): AST[];
export function simplifyAST<T extends CompilerAST>(ast: T): T;

export function simplifyAST(ast: CompilerAST): AST {
    if (Array.isArray(ast)) {
        return ast.map((a) => simplifyAST(a));
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
                : simplifyAST(subAst as any as CompilerNode)),
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
                : simplifyAST(typeAst)),
            type,
        };
    }
    return {
        name: ast.name,
        args: simplifyAST(ast.args),
    };
}

// export function getTypeString(type: Type) {}
