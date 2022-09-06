'use strict';

const mo = require('..');

console.log(mo)
const result = mo.fetchPackage('dfinity/motoko-base/master/src');

console.log('Package:', result);
