// Derived from: https://github.com/dfinity/motoko-playground/blob/main/src/workers/file.ts

// @ts-ignore
import { default as parse } from 'isomorphic-parse-github-url';
import fetch from 'cross-fetch';
import { Motoko } from '.';

export interface PackageInfo {
    name: string;
    repo: string;
    version: string;
    dir: string;
    branch?: string | undefined;
}

async function fetchPackage(mo: Motoko, info: PackageInfo) {
    if (
        !info.repo.startsWith('https://github.com/') ||
        !info.repo.endsWith('.git')
    ) {
        return false;
    }
    const repo = {
        name: info.name,
        version: info.version,
        repo: info.repo.slice(0, -4).replace(/^(https:\/\/github.com\/)/, ''),
        branch: info.version,
        dir: info.dir || 'src',
    };
    const result = await fetchGithub(mo, repo, info.name);
    if (result) {
        mo.addPackage(info.name, info.name + '/');
    }
    return result ? true : false;
}

async function fetchGithub(mo: Motoko, info: PackageInfo, directory = '') {
    const possiblyCDN = !(
        (info.branch.length % 2 === 0 && /^[A-F0-9]+$/i.test(info.branch)) ||
        info.branch === 'master' ||
        info.branch === 'main'
    );
    if (possiblyCDN) {
        const result = await fetchFromCDN(mo, info, directory);
        if (result) {
            return result;
        }
    }
    return await fetchFromGithub(mo, info, directory);
}

// function saveWorkplaceToMotoko(mo, files) {
//     for (const [name, code] of Object.entries(files)) {
//         if (!name.endsWith('mo')) continue;
//         mo.addFile(name, code);
//     }
// }

async function fetchFromCDN(mo: Motoko, info: PackageInfo, directory = '') {
    const meta_url = `https://data.jsdelivr.com/v1/package/gh/${info.repo}@${info.branch}/flat`;
    const base_url = `https://cdn.jsdelivr.net/gh/${info.repo}@${info.branch}`;
    const response = await fetch(meta_url);
    const json = await response.json();
    if (!json.hasOwnProperty('files')) {
        throw new Error(json.message || `Could not fetch from CDN: ${info}`);
    }
    const promises: Promise<void>[] = [];
    const files: Record<string, string> = {};
    for (const f of json.files) {
        if (f.name.startsWith(`/${info.dir}/`) && /\.mo$/.test(f.name)) {
            const promise = (async () => {
                const content = await (await fetch(base_url + f.name)).text();
                const stripped =
                    directory +
                    f.name.slice(info.dir ? info.dir.length + 1 : 0);
                mo.write(stripped, content);
                files[stripped] = content;
            })();
            promises.push(promise);
        }
    }
    if (!promises.length) {
        return;
    }
    return Promise.all(promises).then(() => {
        return files;
    });
}

async function fetchFromGithub(
    mo: Motoko,
    info: PackageInfo,
    directory: string = '',
) {
    const meta_url = `https://api.github.com/repos/${info.repo}/git/trees/${info.branch}?recursive=1`;
    const base_url = `https://raw.githubusercontent.com/${info.repo}/${info.branch}/`;
    const response = await fetch(meta_url);
    const json = await response.json();
    if (!json.hasOwnProperty('tree')) {
        throw new Error(
            json.message || `Could not fetch from GitHub repository: ${info}`,
        );
    }
    const promises: Promise<void>[] = [];
    const files: Record<string, string> = {};
    for (const f of json.tree) {
        if (
            f.path.startsWith(info.dir ? `${info.dir}/` : '') &&
            f.type === 'blob' &&
            /\.mo$/.test(f.path)
        ) {
            const promise = (async () => {
                const content = await (await fetch(base_url + f.path)).text();
                const stripped =
                    directory +
                    (directory ? '/' : '') +
                    f.path.slice(info.dir ? info.dir.length + 1 : 0);
                mo.write(stripped, content);
                files[stripped] = content;
            })();
            promises.push(promise);
        }
    }
    if (!promises.length) {
        return;
    }
    return Promise.all(promises).then(() => {
        return files;
    });
}

// async function resolve(path) {

// }

function parseGithubPackage(
    path: string | PackageInfo,
    name: string,
): PackageInfo {
    if (!path) {
        return;
    }
    if (typeof path === 'object') {
        return path;
    }

    let result;
    try {
        result = parse(path);
        if (!result) {
            return;
        }
    } catch (err) {
        console.warn(err);
    }

    const { name: repoName, filepath, branch, owner } = result;

    return {
        name: name || repoName,
        repo: `https://github.com/${owner}/${repoName}.git`,
        version: branch,
        dir: filepath,
        // homepage: ,
    };
}

export async function loadPackages(
    mo: Motoko,
    packages: Record<string, string | PackageInfo>,
) {
    await Promise.all(
        Object.entries(packages).map(([name, path]) => {
            const info = parseGithubPackage(path, name);
            return fetchPackage(mo, info);
        }),
    );
}

// export async function findPackage(package) {
//     if (typeof package === 'string') {
//         return resolve(package);
//     }
//     return package;
// },
