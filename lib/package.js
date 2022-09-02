'use strict';
// Derived from: https://github.com/dfinity/motoko-playground/blob/main/src/workers/file.ts
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value);
                  });
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : adopt(result.value).then(fulfilled, rejected);
            }
            step(
                (generator = generator.apply(thisArg, _arguments || [])).next(),
            );
        });
    };
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, '__esModule', { value: true });
exports.loadPackages = void 0;
// @ts-ignore
const isomorphic_parse_github_url_1 = __importDefault(
    require('isomorphic-parse-github-url'),
);
const cross_fetch_1 = __importDefault(require('cross-fetch'));
function fetchPackage(mo, info) {
    return __awaiter(this, void 0, void 0, function* () {
        if (
            !info.repo.startsWith('https://github.com/') ||
            !info.repo.endsWith('.git')
        ) {
            return false;
        }
        const repo = {
            name: info.name,
            version: info.version,
            repo: info.repo
                .slice(0, -4)
                .replace(/^(https:\/\/github.com\/)/, ''),
            branch: info.version,
            dir: info.dir || 'src',
        };
        const result = yield fetchGithub(mo, repo, info.name);
        if (result) {
            mo.addPackage(info.name, info.name + '/');
        }
        return result ? true : false;
    });
}
function fetchGithub(mo, info, directory = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const possiblyCDN = !(
            (info.branch.length % 2 === 0 &&
                /^[A-F0-9]+$/i.test(info.branch)) ||
            info.branch === 'master' ||
            info.branch === 'main'
        );
        if (possiblyCDN) {
            const result = yield fetchFromCDN(mo, info, directory);
            if (result) {
                return result;
            }
        }
        return yield fetchFromGithub(mo, info, directory);
    });
}
// function saveWorkplaceToMotoko(mo, files) {
//     for (const [name, code] of Object.entries(files)) {
//         if (!name.endsWith('mo')) continue;
//         mo.addFile(name, code);
//     }
// }
function fetchFromCDN(mo, info, directory = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const meta_url = `https://data.jsdelivr.com/v1/package/gh/${info.repo}@${info.branch}/flat`;
        const base_url = `https://cdn.jsdelivr.net/gh/${info.repo}@${info.branch}`;
        const response = yield (0, cross_fetch_1.default)(meta_url);
        const json = yield response.json();
        if (!json.hasOwnProperty('files')) {
            throw new Error(
                json.message || `Could not fetch from CDN: ${info}`,
            );
        }
        const promises = [];
        const files = {};
        for (const f of json.files) {
            if (f.name.startsWith(`/${info.dir}/`) && /\.mo$/.test(f.name)) {
                const promise = (() =>
                    __awaiter(this, void 0, void 0, function* () {
                        const content = yield (yield (0, cross_fetch_1.default)(
                            base_url + f.name,
                        )).text();
                        const stripped =
                            directory +
                            f.name.slice(info.dir ? info.dir.length + 1 : 0);
                        mo.write(stripped, content);
                        files[stripped] = content;
                    }))();
                promises.push(promise);
            }
        }
        if (!promises.length) {
            return;
        }
        return Promise.all(promises).then(() => {
            return files;
        });
    });
}
function fetchFromGithub(mo, info, directory = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const meta_url = `https://api.github.com/repos/${info.repo}/git/trees/${info.branch}?recursive=1`;
        const base_url = `https://raw.githubusercontent.com/${info.repo}/${info.branch}/`;
        const response = yield (0, cross_fetch_1.default)(meta_url);
        const json = yield response.json();
        if (!json.hasOwnProperty('tree')) {
            throw new Error(
                json.message ||
                    `Could not fetch from GitHub repository: ${info}`,
            );
        }
        const promises = [];
        const files = {};
        for (const f of json.tree) {
            if (
                f.path.startsWith(info.dir ? `${info.dir}/` : '') &&
                f.type === 'blob' &&
                /\.mo$/.test(f.path)
            ) {
                const promise = (() =>
                    __awaiter(this, void 0, void 0, function* () {
                        const content = yield (yield (0, cross_fetch_1.default)(
                            base_url + f.path,
                        )).text();
                        const stripped =
                            directory +
                            (directory ? '/' : '') +
                            f.path.slice(info.dir ? info.dir.length + 1 : 0);
                        mo.write(stripped, content);
                        files[stripped] = content;
                    }))();
                promises.push(promise);
            }
        }
        if (!promises.length) {
            return;
        }
        return Promise.all(promises).then(() => {
            return files;
        });
    });
}
// async function resolve(path) {
// }
function parseGithubPackage(path, name) {
    if (!path) {
        return;
    }
    if (typeof path === 'object') {
        return path;
    }
    let result;
    try {
        result = (0, isomorphic_parse_github_url_1.default)(path);
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
function loadPackages(mo, packages) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(
            Object.entries(packages).map(([name, path]) => {
                const info = parseGithubPackage(path, name);
                return fetchPackage(mo, info);
            }),
        );
    });
}
exports.loadPackages = loadPackages;
// export async function findPackage(package) {
//     if (typeof package === 'string') {
//         return resolve(package);
//     }
//     return package;
// },
//# sourceMappingURL=package.js.map
