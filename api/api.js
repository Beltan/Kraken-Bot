let store = require('../store');
const helper = require('../helper');
const constants = require('../constants');
const config = require('../config').api;
const broker = require('../config').broker;
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: config.key,
    APISECRET: config.secret
});

exports.getValues = async function () {
    await helper.sleep(1000);

    try {
        store.depth = await binance.depth(helper.getPair(broker.pair[0]));
        store.balance = await binance.balance();
        store.openorders = await binance.openOrders(helper.getPair(broker.pair[0]));
        store.candles['5m'] = await helper.getHistoric(helper.getPair(broker.pair[0]), '5m');
        store.candles['1h'] = await helper.getHistoric(helper.getPair(broker.pair[0]), '1h');
        store.candles['1d'] = await helper.getHistoric(helper.getPair(broker.pair[0]), '1d');
    } catch (e) {
        console.log('Error while retrieving info, trying again... -> ' + e);
    }
}

let cancelOrder = async function(decision) {
    let txid = decision.txid;
    try {
        let order = await binance.cancel(helper.getPair(broker.pair[0]), txid);
        console.log('Order ' + txid + ' canceled succesfully');
        return order;
    } catch (e) {
        console.log('Error while canceling order, order not canceled. Trying again... -> ' + e);
    }
}

let placeOrder = async function(decision) {
    let pair = helper.getPair(broker.pair[0]);
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