const config = require('./../config').api;
var api = {};

if (config.simulation) api = require('./simulationApi');
else api = require('./api');

module.exports = api;
