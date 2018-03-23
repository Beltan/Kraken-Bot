const config = require('./../config').api;

const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

// Kraken calls, pending review

function cancelOrder(txid) {
    kraken.api('CancelOrder', {txid}, results);
}

function placeOrder() {
    var pair = 'XRPUSD';
    var type = 'buy';
    var ordertype = 'limit';
    var price = 0.01;
    var volume = 30;
    kraken.api('AddOrder', {pair, type, ordertype, price, volume}, results);
}

function results (error, data) {
    if(error != null){
        console.log(error);
    }else {
        return data;
    }
}

exports.getValues = async function (txid) {
    var count = 1;
    var pair = api.pair;
    try {
        var response = await kraken.api('Depth', {pair, count});
        var tradeBalances = await kraken.api('Balance', {});
        var orders = await kraken.api('QueryOrders', {txid});
        var balance = tradeBalances[api.second];
        var bid = response['result'][api.fullPair]['bids'][0][0];
        var ask = response['result'][api.fullPair]['asks'][0][0];
        var value = (bid + ask) / 2;
        var values = {bid, ask, value, balance, orders};
        return values;
    }
    catch (e) {
        api.errorHistory.push(e);
    }
}

exports.initialize = function(pair) {
    api.pair = pair;
    api.first = pair.substring(0, 3);
    api.second = pair.substring(3, 6);
    api.fullPair = 'X' + api.first + 'Z' + api.second;
    api.errorHistory = [];
}

exports.continue = function() {
    return true;
}