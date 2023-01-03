'use strict';

const mo = require('..');

mo.fetchPackage('base', 'dfinity/motoko-base/master/src')
    .then(async ({ files, ...meta }) => {
        console.log('Metadata:', meta);
        console.log('Files:', Object.keys(files))
    });
