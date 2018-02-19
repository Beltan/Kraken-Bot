config = require('./config');
store = require('./store');
functions = require('./functions');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

functions.loop(); // Gets a determined past history

// Real time values and test trading
setInterval (functions.trade, 10000);
setInterval (functions.depth, 10000);
setInterval (functions.historicInit, 10000);