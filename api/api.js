const constants = require('../constants');
const config = require('./../config').api;
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.getValues = async function () {
    await sleep(3000);

    var count = 1;
    var pair = api.pair;
    var txid = '';
    if (api.keys.length != 0) {
        var txid = api.keys.join (', ');
    }
    try {
        var balance = [];
        var response = await kraken.api('Depth', {pair, count});
        var tradeBalances = await kraken.api('Balance', {});
        if (txid != '') {
            var info = await kraken.api('QueryOrders', {txid});
            var orders = info.result;
        }
        balance[0] = Number(tradeBalances.result['Z' + api.second]);
        balance[1] = Number(tradeBalances.result['X' + api.first]);
        var bid = Number(response['result'][api.fullPair]['bids'][0][0]);
        var ask = Number(response['result'][api.fullPair]['asks'][0][0]);
        var value = (bid + ask) / 2;
        console.log(bid + ' ' + ask);
        var values = {bid, ask, value, balance, orders};
        return values;
    }
    catch (e) {
        api.errorHistory.push(e);
        console.log('Error while retrieving info, trying again... -> ' + e);
    }
}

var cancelOrder = async function(decision) {
    var txid = decision.txid;
    try {
        var order = await kraken.api('CancelOrder', {txid});
        console.log('Order ' + txid + ' canceled succesfully');
        return order;
    } catch (e) {
        api.errorHistory.push(e);
        console.log('Error while canceling order, order not canceled. Trying again... -> ' + e);
    }
}

var placeOrder = async function(decision) {
    var pair = api.pair;
    var type = decision.order;
    var price = decision.price;
    var volume = decision.quantity;
    var ordertype = decision.ordertype;
    var userref = decision.userref;
    try {
        var order = await kraken.api('AddOrder', {pair, type, price, volume, ordertype, userref});
        decision.keys.push(order.result.txid[0]);
        api.keys = decision.keys;
        console.log(type + ' order placed succesfully -> ' + type + ' ' + volume + ' ' + pair + ' @ ' + ordertype + ' ' + price);
        return order;
    }
    catch (e) {
        api.errorHistory.push(e);
        console.log('Error while placing ' + type + ', ' + type + ' not placed. Trying again... -> ' + e);
    }
}

var updateOrder = async function(decision) {
    try {
        var result = await cancelOrder(decision);
    } catch (e) {}
    if (result != undefined) {
        try {
            var order = await placeOrder(decision);
            return order;
        } catch (e) {}
    }
}

var executeFunctions = {};
executeFunctions[constants.placeBuy] = placeOrder;
executeFunctions[constants.placeSell] = placeOrder;
executeFunctions[constants.cancel] = cancelOrder;
executeFunctions[constants.updateBuy] = updateOrder;
executeFunctions[constants.updateSell] = updateOrder;
exports.executeFunctions = executeFunctions;

exports.init = function() {
    var pair = config.pair;
    api.pair = pair;
    api.first = pair.substring(0, 3);
    api.second = pair.substring(3, 6);
    api.fullPair = 'X' + api.first + 'Z' + api.second;
    api.errorHistory = [];
    api.keys = [];
}

exports.continue = function() {
    return true;
}