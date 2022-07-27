'use strict';
// Derived from: https://github.com/dfinity/motoko-playground/blob/main/src/workers/file.ts

const parse = require('parse-github-url');
const fetch = require('cross-fetch');

async function fetchPackage(mo, info) {
    if (
        !info.repo.startsWith('https://github.com/') ||
        !info.repo.endsWith('.git')
    ) {
        return false;
    }
    const repo = {
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

async function fetchGithub(mo, repo, directory = '') {
    const possiblyCDN = !(
        (repo.branch.length % 2 === 0 && /^[A-F0-9]+$/i.test(repo.branch)) ||
        repo.branch === 'master' ||
        repo.branch === 'main'
    );
    if (possiblyCDN) {
        const result = await fetchFromCDN(repo, directory);
        if (result) {
            return result;
        }
    }
    return await fetchFromGithub(mo, repo, directory);
}

function saveWorkplaceToMotoko(mo, files) {
    for (const [name, code] of Object.entries(files)) {
        if (!name.endsWith('mo')) continue;
        mo.addFile(name, code);
    }
}

async function fetchFromCDN(mo, repo, directory = '') {
    const meta_url = `https://data.jsdelivr.com/v1/package/gh/${repo.repo}@${repo.branch}/flat`;
    const base_url = `https://cdn.jsdelivr.net/gh/${repo.repo}@${repo.branch}`;
    const response = await fetch(meta_url);
    const json = await response.json();
    if (!json.hasOwnProperty('files')) {
        throw new Error(json.message || `Could not fetch from CDN: ${repo}`);
    }
    const promises = [];
    const files = {};
    for (const f of json.files) {
        if (f.name.startsWith(`/${repo.dir}/`) && /\.mo$/.test(f.name)) {
            const promise = (async () => {
                const content = await (await fetch(base_url + f.name)).text();
                const stripped =
                    directory +
                    f.name.slice(repo.dir ? repo.dir.length + 1 : 0);
                mo.addFile(stripped, content);
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

async function fetchFromGithub(mo, repo, directory = '') {
    const meta_url = `https://api.github.com/repos/${repo.repo}/git/trees/${repo.branch}?recursive=1`;
    const base_url = `https://raw.githubusercontent.com/${repo.repo}/${repo.branch}/`;
    const response = await fetch(meta_url);
    const json = await response.json();
    if (!json.hasOwnProperty('tree')) {
        throw new Error(
            json.message || `Could not fetch from GitHub repository: ${repo}`,
        );
    }
    const promises = [];
    const files = {};
    for (const f of json.tree) {
        if (
            f.path.startsWith(repo.dir ? `${repo.dir}/` : '') &&
            f.type === 'blob' &&
            /\.mo$/.test(f.path)
        ) {
            const promise = (async () => {
                const content = await (await fetch(base_url + f.path)).text();
                const stripped =
                    directory +
                    (directory ? '/' : '') +
                    f.path.slice(repo.dir ? repo.dir.length + 1 : 0);
                mo.addFile(stripped, content);
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

function parseGithubPackage(path, name) {
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

    console.log(result);
    const { name: repoName, filepath, branch, owner } = result;

    return {
        name: name || repoName,
        // repo,
        repo: `https://github.com/${owner}/${repoName}.git`,
        version: branch,
        dir: filepath,
        // homepage: ,
    };
}

module.exports = {
    async loadPackages(packages) {
        for (const [name, path] of Object.entries(packages)) {
            const mo = require('.');
            const info = parseGithubPackage(path, name);
            return fetchPackage(mo, info);
        }
    },
};
