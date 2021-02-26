let store = require('../store');
const constants = require('../constants');
const config = require('../config').api;
const broker = require('../config').broker;
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: config.key,
    APISECRET: config.secret
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.getValues = async function () {
    await sleep(1000);

    try {
        store.depth = await binance.depth(broker.pair[0]);
        store.balance = await binance.balance();
        store.openorders = await binance.openOrders(broker.pair[0]);
        store.candles = await getHistoric();
    } catch (e) {
        console.log('Error while retrieving info, trying again... -> ' + e);
    }
}

let getHistoric = async function () {
    try {
        let limit = Math.min(broker.limit, 500);
        let values = await binance.candlesticks(broker.pair[0], broker.interval, null, limit);
        return values;
    } catch (e) {
        console.log('Error while retrieving info, trying again... -> ' + e);
    }
}

let cancelOrder = async function(decision) {
    let txid = decision.txid;
    try {
        let order = await binance.cancel(broker.pair[0], txid);
        console.log('Order ' + txid + ' canceled succesfully');
        return order;
    } catch (e) {
        console.log('Error while canceling order, order not canceled. Trying again... -> ' + e);
    }
}

let placeOrder = async function(decision) {
    let pair = broker.pair[0];
    let type = decision.order;
    let price = decision.price;
    let volume = decision.quantity;
    let ordertype = decision.ordertype;
    let order = null;

    try {
        if (ordertype === 'market') {
            if (type === 'buy') order = await binance.marketBuy(pair, volume);
            else if (type === 'sell') order = await binance.marketSell(pair, volume);
        } else {
            if (type === 'buy') order = await binance.buy(pair, volume, price);
            else if (type === 'sell') order = await binance.sell(pair, volume, price);
        }

        console.log(type + ' order placed succesfully -> ' + type + ' ' + volume + ' ' + pair + ' @ ' + ordertype + ' ' + price);
        return order;
    }
    catch (e) {
        console.log('Error while placing ' + type + ', ' + type + ' not placed. Trying again... -> ' + e);
    }
}

let updateOrder = async function(decision) {
    let result = null;

    try {
        result = await cancelOrder(decision);
    } catch (e) {}
    if (result !== null) {
        try {
            let order = await placeOrder(decision);
            return order;
        } catch (e) {}
    }
}

let executeFunctions = {};
executeFunctions[constants.placeBuy] = placeOrder;
executeFunctions[constants.placeSell] = placeOrder;
executeFunctions[constants.cancel] = cancelOrder;
executeFunctions[constants.updateBuy] = updateOrder;
executeFunctions[constants.updateSell] = updateOrder;
exports.executeFunctions = executeFunctions;

exports.init = function() {

}

exports.continue = function() {
    return true;
}