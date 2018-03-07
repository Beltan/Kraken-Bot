config = require('./../config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

var api = {};

exports.execute = function(decision) {

    if (decision.type == 'buy') {
        var commission = decision.quantity * 0.0015;
        var quantity = decision.quantity - commission;
        api.balance[api.second] = api.balance[api.second] - commission - quantity;
        api.balance[api.first] = api.balance[api.first] + quantity / decision.price;
        var history = {'position' : api.tradeHistory.length, 'buyPrice' : decision.price, 'quantity' : quantity / decision.price, 'buyCommission' : commission, 'balanceCrypto' : api.balance[api.first]};
        api.tradeHistory.push(history);
        api.openTrades.push(history);
    } else if (decision.type == 'sell') {
        var commission = decision.quantity * decision.price * 0.0015;
        api.balance[api.second] = api.balance[api.second] + decision.quantity * decision.price - commission;
        api.balance[api.first] = api.balance[api.first] - decision.quantity;
        var index = api.openTrades[decision.index].position;
        var percentage = 100 * ((decision.price * decision.quantity - commission - (api.tradeHistory[index]['buyPrice'] * api.tradeHistory[index]['quantity']) - api.tradeHistory[index]['buyCommission']) / (api.tradeHistory[index]['buyPrice'] * api.tradeHistory[index]['quantity']));
        var history = {'sellPrice' : decision.price, 'sellCommission' : commission, 'balanceFiat' : api.balance[api.second], 'netPercentage' : percentage};
        Object.assign(api.tradeHistory[index], history);
        api.openTrades.splice(decision.index, 1);
    }
}

exports.getValues = function() {
    var value;
    if (api.index < api.historic.length){
        value = api.historic[api.index];
        api.index++;        
    }

    var bid = value * 0.9995;
    var ask = value * 1.0005;
    var openTrades = api.openTrades;
    var balance = api.balance[api.second];
    var values = {bid, ask, value, openTrades, balance};
    return values;
}

exports.initialize = function(pair) {
    api.pair = pair;
    api.first = pair.substring(0, 3);
    api.second = pair.substring(3, 6);
    api.balance = {[api.second] : 50, [api.first] : 0};
    api.index = 0;
    api.tradeHistory = [];
    api.openTrades = [];
    api.historic = [];

    this.csvToArray();
}

exports.csvToArray = function() {
    var stuff = fs.readFileSync('./historics/' + api.pair + '.csv', 'utf8');
    api.historic = stuff.split(',');
}

exports.getApiState = function() {
    // Returns a copy of the state of the api
    return JSON.parse(JSON.stringify(api));
}

exports.continue = function() {
    return api.index < api.historic.length;
}