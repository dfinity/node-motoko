'use strict';

const mo = require('..');

mo.fetchPackage('dfinity/motoko-base/master/src')
    .then(async (pkg) => {
        const pkgMeta = { ...pkg };
        delete pkgMeta.files;
        console.log('Package:', pkgMeta);
        console.log('Files', Object.keys(pkg.files))
    })
