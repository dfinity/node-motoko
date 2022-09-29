// Derived from: https://github.com/dfinity/motoko-playground/blob/main/src/workers/file.ts

// @ts-ignore
import { default as parse } from 'isomorphic-parse-github-url';
import fetch from 'cross-fetch';
import { Motoko } from '.';
import sanitize from 'sanitize-filename';

export interface PackageInfo {
    name: string;
    repo: string;
    version: string;
    dir?: string;
    branch?: string | undefined;
}

export interface Package {
    name: string;
    version: string;
    files: PackageFiles;
}

export type PackageFiles = Record<string, PackageFile>;

export interface PackageFile {
    content: string;
}

// TODO: call `fetchPackage` instead of deprecated functions
async function loadPackage(mo: Motoko, info: PackageInfo) {
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
    const result = await fetchGithub_(mo, repo, info.name);
    if (result) {
        mo.usePackage(info.name, info.name + '/');
    }
    return result ? true : false;
}

/** @deprecated */
async function fetchGithub_(mo: Motoko, info: PackageInfo, directory = '') {
    const possiblyCDN = !(
        (info.branch.length % 2 === 0 && /^[A-F0-9]+$/i.test(info.branch)) ||
        info.branch === 'master' ||
        info.branch === 'main'
    );
    if (possiblyCDN) {
        const result = await fetchFromCDN_(mo, info, directory);
        if (result) {
            return result;
        }
    }
    return await fetchFromGithub_(mo, info, directory);
}

// function saveWorkplaceToMotoko(mo, files) {
//     for (const [name, code] of Object.entries(files)) {
//         if (!name.endsWith('mo')) continue;
//         mo.addFile(name, code);
//     }
// }

/** @deprecated */
async function fetchFromCDN_(mo: Motoko, info: PackageInfo, directory = '') {
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

/** @deprecated */
async function fetchFromGithub_(
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

function parseGithubPackageInfo(path: string | PackageInfo): PackageInfo {
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
        // console.warn(err);
        return;
    }

    const { name, filepath, branch, owner } = result;
    return {
        name,
        repo: `https://github.com/${owner}/${name}.git`,
        version: branch,
        dir: filepath,
        branch,
        // homepage: ,
    };
}

async function fetchPackageFiles(
    info: PackageInfo,
): Promise<PackageFiles | undefined> {
    const prefix = 'https://github.com/';
    const suffix = '.git';
    if (!info.repo.startsWith(prefix) || !info.repo.endsWith(suffix)) {
        return;
    }
    const repoPart = info.repo.slice(prefix.length, -suffix.length);

    // TODO: modify condition?
    const possiblyCDN = !(
        (info.branch &&
            info.branch.length % 2 === 0 &&
            /^[A-F0-9]+$/i.test(info.branch)) ||
        info.branch === 'master' ||
        info.branch === 'main'
    );
    if (possiblyCDN) {
        const result = await fetchFromService(
            info,
            'CDN',
            `https://data.jsdelivr.com/v1/package/gh/${repoPart}@${info.branch}/flat`,
            `https://cdn.jsdelivr.net/gh/${repoPart}@${info.branch}`,
            'files',
            'name',
        );
        if (result?.length) {
            return result;
        }
    }
    return await fetchFromService(
        info,
        'GitHub',
        `https://api.github.com/repos/${repoPart}/git/trees/${info.branch}?recursive=1`,
        `https://raw.githubusercontent.com/${repoPart}/${info.branch}/`,
        'tree',
        'path',
        (file) => file.type === 'blob',
    );
}

async function fetchFromService(
    info: PackageInfo,
    serviceName: string,
    metaUrl: string,
    baseUrl: string,
    resultProperty: string,
    pathProperty: string,
    condition?: (file: any) => boolean,
): Promise<PackageFiles | undefined> {
    const response = await fetch(metaUrl);
    if (!response.ok) {
        throw Error(
            response.statusText ||
                `Could not fetch from ${serviceName}: ${info.repo}`,
        );
    }
    const json = await response.json();
    if (!json.hasOwnProperty(resultProperty)) {
        throw new Error(`Unexpected response from ${serviceName}`);
    }
    // Remove leading and trailing '/' from directory
    let directory = info.dir
        ? info.dir.replace(/^\//, '').replace(/\/$/, '')
        : '';
    const files: Record<string, PackageFile> = {};
    await Promise.all(
        (<any[]>json[resultProperty])
            .filter((file) => {
                return (
                    (!directory ||
                        file[pathProperty].startsWith(
                            file[pathProperty].startsWith('/')
                                ? `/${directory}`
                                : directory,
                        )) &&
                    (!condition || condition(file)) &&
                    /\.mo$/.test(file[pathProperty])
                );
            })
            .map(async (file) => {
                const response = await fetch(`${baseUrl}${file[pathProperty]}`);
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                const content = await response.text();
                let path = file[pathProperty];
                if (path.startsWith('/')) {
                    path = path.slice(1);
                }
                if (directory) {
                    // Remove directory prefix
                    path = path.slice(directory.length + 1);
                }
                files[path] = {
                    content,
                };
            }),
    );
    return files;
}

export async function fetchPackage(
    info: string | PackageInfo,
): Promise<Package | undefined> {
    if (typeof info === 'string') {
        info = parseGithubPackageInfo(info);
    }
    const files = await fetchPackageFiles(info);
    if (!files) {
        return;
    }
    return {
        name: info.name,
        version: info.version,
        files,
    };
}

export async function installPackages(
    mo: Motoko,
    packages: Record<string, string | PackageInfo>,
) {
    await Promise.all(
        Object.entries(packages).map(([name, path]) => {
            const info = {
                ...parseGithubPackageInfo(path),
                name,
            };
            return loadPackage(mo, info);
        }),
    );
}

export function validatePackage(pkg: Package) {
    function showValue(value: any) {
        const string = JSON.stringify(value);
        return string.length > 50 ? string.substring(0, 50) + '...' : string;
    }
    function getPackageDisplayName() {
        return `(${pkg.name} / ${pkg.version})`;
    }

    if (typeof pkg !== 'object' || Array.isArray(pkg)) {
        throw new Error(`Unexpected package: ${showValue(pkg)}`);
    }
    if (typeof pkg.name !== 'string' || sanitize(pkg.name) !== pkg.name) {
        throw new Error(`Invalid package name ${getPackageDisplayName()}`);
    }
    if (
        typeof pkg.version !== 'string' ||
        sanitize(pkg.version) !== pkg.version
    ) {
        throw new Error(`Invalid package version ${getPackageDisplayName()}`);
    }
    if (typeof pkg.files !== 'object' || Array.isArray(pkg.files)) {
        throw new Error(`Invalid package files: ${showValue(pkg.files)}`);
    }

    Object.entries(pkg.files).forEach(([path, file]) => {
        if (
            typeof path !== 'string' ||
            path.split('/').some((p) => sanitize(p) !== p)
        ) {
            throw new Error(
                `Invalid file path ${getPackageDisplayName()} [${path}]`,
            );
        }
        if (typeof file !== 'object' || Array.isArray(file)) {
            throw new Error(
                `Invalid file ${getPackageDisplayName()} [${path}]: ${showValue(
                    file,
                )}`,
            );
        }
        if (typeof file.content !== 'string') {
            throw new Error(
                `Invalid file content ${getPackageDisplayName()} [${path}]: ${showValue(
                    file.content,
                )}`,
            );
        }
    });
}
