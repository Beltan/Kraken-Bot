config = require('./config');
const KrakenClient = require('kraken-api');

const key = config.key; // API Key
const secret = config.secret; // API Private Key

const kraken = new KrakenClient(key, secret);

var balance = {'euros' : 50, 'XRPUSD' : 0}

var transactionHistory = [];

module.exports.getBalance = function() {
    return balance;
}

module.exports.placeBuyOrder = function(value) {
    commission = balance['euros'] * 0.0015;
    balance['euros'] = balance['euros'] - commission;
    balance['XRPUSD'] = balance['euros'] / value;
    balance['euros'] = 0;

    var history = {'type' : "buy", "value" : value, "commission" : commission, "balance" : balance};
    transactionHistory.push(history);
}

module.exportsfunction.placeSellOrder = function(value) {
    commission = balance['XRPUSD'] * value * 0.0015;
    balance['euros'] = balance['XRPUSD'] * value - commission;
    balance['XRPUSD'] = 0;
    
    var history = {'type' : "sell", "value" : value, "commission" : commission, "balance" : balance};
    transactionHistory.push(history);
}