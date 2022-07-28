'use strict';

const fs = require('fs');
const { join } = require('path');
const { minify } = require('uglify-js');

// Reduce moc.js from ~21 MB to ~5 MB

var result = minify(
    fs.readFileSync(join(__dirname, '../../motoko/src/moc.js'), 'utf-8'),
);

fs.writeFileSync(join(__dirname, '../lib/generated/moc.js'), result.code);
