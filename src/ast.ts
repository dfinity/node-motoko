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
    typeRep?: Node,
    doc?: string;
    declaration?: Source;
    args?: AST[];
}

export function asNode(ast: AST | undefined): Node | undefined {
    if (ast && typeof ast === 'object' && !Array.isArray(ast)) {
        return ast;
    }
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
            CompilerNode,
        ];
        const node =
            typeof subAst === 'string'
                ? { name: subAst, parent }
                : simplifyAST(subAst, parent);
        node.start = [+start.args[1], +start.args[2]];
        node.end = [+end.args[1], +end.args[2]];
        const file = start.args[0];
        if (file) {
            node.file = file;
        }
        return node;
    }
    if (ast.name === '@@') {
        type RegionSpan = { name: 'Pos'; args: [string, string] };
        const [file, start, end] = ast.args as [string, RegionSpan, RegionSpan];
        return {
            name: 'Region',
            file,
            start: [+start.args[0], +start.args[1]],
            end: [+end.args[0], +end.args[1]],
        };
    }
    if (ast.name === ':') {
        const [typeAst, type, typeRep] = ast.args as
            [CompilerNode, string, CompilerNode];
        const node =
            typeof typeAst === 'string'
                ? { name: typeAst, parent }
                : simplifyAST(typeAst, parent);
        node.type = type;
        node.typeRep = simplifyAST(typeRep, parent);
        return node;
    }
    if (ast.name === '*') {
        const [doc, docAst] = ast.args as [string, CompilerNode];
        const node =
            typeof docAst === 'string'
                ? { name: docAst, parent }
                : simplifyAST(docAst, parent);
        node.doc = doc;
        return node;
    }
    const node: Node = {
        name: ast.name,
    };
    Object.defineProperty(node, 'parent', {
        value: parent,
        enumerable: false,
    });
    node.args = simplifyAST(ast.args, node);
    if (parent && ast.name === 'ID') {
        // Inherit properties from parent for convenience.
        Object.defineProperty(node, 'type', {
            get: () => parent.type,
            set: (newType) => parent.type = newType,
            enumerable: true,
            configurable: true,
        });
        Object.defineProperty(node, 'typeRep', {
            get: () => parent.typeRep,
            set: (newTypeRep) => parent.typeRep = newTypeRep,
            enumerable: true,
            configurable: true,
        });
        Object.defineProperty(node, 'doc', {
            get: () => parent.doc,
            set: (newDoc) => parent.doc = newDoc,
            enumerable: true,
            configurable: true,
        });
    }
    return node;
}
