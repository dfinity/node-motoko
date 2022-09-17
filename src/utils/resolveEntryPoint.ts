import { Motoko } from '..';

// function getOne<T>(values: T[]): T | undefined {
//     if (values.length) {
//         return values[0];
//     }
// }

function resolveEntryPoint(
    mo: Motoko,
    directory: string,
    expected: string,
): string {
    directory = directory || '';
    if (directory && !directory.endsWith('/')) {
        directory += '/';
    }

    const moFiles = mo.list(directory).filter((f) => /\.mo$/i.test(f));
    if (moFiles.length === 1) {
        return moFiles[0];
    } else if (moFiles.length === 0) {
        throw new Error(
            'Could not find any Motoko files in the top-level directory',
        );
    }

    const expectedFiles = moFiles.filter(
        (f) => f.toLowerCase() === expected.toLowerCase(),
    );
    if (expectedFiles.length === 1) {
        return expectedFiles[0];
    } else if (expectedFiles.length > 1) {
        throw new Error(
            `Found ${expectedFiles.length} entry point files with different capitalization`,
        );
    }

    throw new Error(
        `Found ${moFiles.length} possible entry points. Please rename one of these files to '${expected}'`,
    );

    // TODO: evaluate whether we want to choose an entry point by parsing files

    // const parsedFiles = moFiles.map((f) => {
    //     try {
    //         return mo.parseMotoko(mo.read(directory + f));
    //     } catch (err) {
    //         throw new Error(`Parse error in ${f}`);
    //     }
    // });

    // console.log(parsedFiles);

    // return getOne(parsedFiles.filter());
}

export function resolveMain(mo: Motoko, directory: string): string {
    return resolveEntryPoint(mo, directory, 'Main.mo');
}

export function resolveLib(mo: Motoko, directory: string): string {
    return resolveEntryPoint(mo, directory, 'Lib.mo');
}
