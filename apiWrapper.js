config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

var api = {};

exports.execute = function(decision) {
   
    if (decision.type == 'buy') {
        commission = decision.quantity * 0.0015;
        decision.quantity = decision.quantity - commission;
        api.balance[api.second] = api.balance[api.second] - commission - decision.quantity;
        api.balance[api.first] = api.balance[api.first] + decision.quantity / decision.price;
        var history = {'type' : 'buy', 'value' : decision.price, 'quantity' : decision.quantity / decision.price, 'commission' : commission, 'balance' : api.balance[api.first] + api.balance[api.second] / decision.price};
        api.tradeHistory.push(history);
        api.openTrades.push(history);
    } else if (decision.type == 'sell') {
        commission = decision.quantity * decision.price * 0.0015;
        api.balance[api.second] = api.balance[api.second] + decision.quantity * decision.price - commission;
        api.balance[api.first] = api.balance[api.first] - decision.quantity;
        var history = {'type' : 'sell', 'value' : decision.price, 'quantity' : decision.quantity, 'commission' : commission, 'balance' : api.balance[api.second] + api.balance[api.first] * decision.price};
        api.tradeHistory.push(history);
        api.openTrades.splice(decision.index, 1);
    }
}

exports.getValues = function() {
    if (api.index < api.historic.length){
        api.index++;
        value = api.historic[api.index];
    }

    var bid = value * 0.9995;
    var ask = value * 1.0005;
    var nextbid = api.historic[api.index + 1] * 0.9995;
    var openTrades = api.openTrades;
    var balance = api.balance[api.second];
    var values = {bid, nextbid, ask, value, openTrades, balance};
    return values;
}

exports.initialize = function(pair) {
    api.pair = pair;
    api.first = pair.substring(0, 3);
    api.second = pair.substring(3, 6);
    api.balance = {[api.second] : 50, [api.first] : 0};
    api.index = -1;
    api.tradeHistory = [];
    api.openTrades = [];
    api.historic = [];

    this.csvToArray();
}

exports.csvToArray = function() {
    var stuff = fs.readFileSync('./' + api.pair + '.csv', 'utf8');
    api.historic = stuff.split(',');
}

exports.getApiState = function() {
    return api;
}