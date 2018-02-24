config = require('./config');
const KrakenClient = require('kraken-api');

const key = config.key; // API Key
const secret = config.secret; // API Private Key

const kraken = new KrakenClient(key, secret);

var balance = {'euros' : 50, 'XRPUSD' : 0}

var lastPrice = null;

var transactionHistory = [];

module.exports.getBalance = function() {
    return balance;
}

module.exports.getCurrentOrders = function() {
    return lastPrice;
}

module.exports.placeBuyOrder = function(value) {
    commission = balance['euros'] * 0.0015;
    balance['euros'] = balance['euros'] - commission;
    balance['XRPUSD'] = balance['euros'] / value;
    balance['euros'] = 0;

    var history = {'type' : "buy", "value" : value, "commission" : commission, "balance" : balance};
    transactionHistory.push(history);
}

module.exports.placeSellOrder = function(value) {
    commission = balance['XRPUSD'] * value * 0.0015;
    balance['euros'] = balance['XRPUSD'] * value - commission;
    balance['XRPUSD'] = 0;
    
    var history = {'type' : "sell", "value" : value, "commission" : commission, "balance" : balance};
    transactionHistory.push(history);
}

//Update functions

var callbackUpdatePrice = function(error, data) {
    if(error != null) {
        console.log(error);
        return;
    }

    lastPrice = {};
    lastPrice.spread = 100 * (data.result.XXRPZUSD.asks[0][0] - data.result.XXRPZUSD.bids[0][0]) / data.result.XXRPZUSD.asks[0][0];
    lastPrice.bid = data.result.XXRPZUSD.bids[0][0];
    lastPrice.ask = data.result.XXRPZUSD.asks[0][0];
}

function updatePrice() {
    pair = 'XRPUSD';
    count = 1;
    kraken.api('Depth', {pair, count}, callbackUpdatePrice);
}

setInterval (updatePrice, 10000);