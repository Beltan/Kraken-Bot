config = require('./config');
store = require('./store');
functions = require('./functions');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);


/*
// Real time values and test trading
setInterval (functions.trade, 10000);
setInterval (functions.depth, 10000);
setInterval (functions.historicInit, 10000);
*/

setInterval(function() {functions.getHistoric('XRPUSD');}, 3000);