export type CompilerAST = CompilerAST[] | CompilerNode | string | null;
export type CompilerSpan = { name: 'Pos'; args: [string, string, string] };

export interface CompilerNode {
    name: string;
    args: CompilerAST[];
}

export type Span = [number, number];
export type AST = AST[] | Node | string | null;

export interface Source {
    file?: string;
    start?: Span;
    end?: Span;
}

export interface Node extends Source {
    name: string;
    file?: string;
    start?: Span;
    end?: Span;
    type?: Node;
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
        return {
            ...(typeof subAst === 'string'
                ? { name: subAst }
                : simplifyAST(subAst)),
            file: start.args[0],
            start: [+start.args[1], +start.args[2]],
            end: [+end.args[1], +end.args[2]],
        };
    }
    if (ast.name === ':') {
        const [typeAst, type] = ast.args as [CompilerAST, CompilerNode];
        // console.log(typeAst); ////
        return {
            ...(typeof typeAst === 'string'
                ? { name: typeAst }
                : simplifyAST(typeAst)),
            type: simplifyAST(type),
        };
    }
    return {
        name: ast.name,
        args: simplifyAST(ast.args),
    };
}

// export function getTypeString(type: Type) {}
