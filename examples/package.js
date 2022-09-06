'use strict';

const mo = require('..');

mo.fetchPackage('dfinity/motoko-base/master/src')
    .then(async ({ files, ...meta }) => {
        console.log('Metadata:', meta);
        console.log('Files:', Object.keys(files))
    })
