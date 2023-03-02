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

    const possiblyCDN = !(
        (info.branch &&
            info.branch.length % 2 === 0 &&
            /^[A-F0-9]+$/i.test(info.branch)) ||
        info.branch === 'master' ||
        info.branch === 'main'
    );
    if (possiblyCDN) {
        try {
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
        catch(err) {
            console.error('[CDN]', err);
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
    name: string,
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
        name,
        version: info.version,
        files,
    };
}

export async function installPackages(
    mo: Motoko,
    packages: Record<string, string | PackageInfo>,
) {
    await Promise.all(
        Object.entries(packages).map(async ([name, info]) => {
            const pkg = await fetchPackage(name, info);
            mo.loadPackage(pkg);
            return pkg;
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
