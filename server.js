'use strict';

var driver = require('./driver').createDriver({});

driver.start(function(err) {
    if (err) throw err;
});
