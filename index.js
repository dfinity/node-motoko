'use strict';

module.exports = require('./lib')(
    require('./versions/latest/moc.min').Motoko,
    'latest',
);
