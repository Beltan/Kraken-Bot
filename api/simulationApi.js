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
        store.depth = await binance.depth(broker.pair[0]);
        store.balance = await binance.balance();
        store.openorders = await binance.openOrders(broker.pair[0]);
        store.candles['5m'] = await helper.getHistoric(broker.pair[0], '5m');
        store.candles['1h'] = await helper.getHistoric(broker.pair[0], '1h');
        store.candles['1d'] = await helper.getHistoric(broker.pair[0], '1d');
    } catch (e) {
        console.log('Error while retrieving info, trying again... -> ' + e);
    }
}

// and then we add the functions to the object
let executeFunctions = {};/*
executeFunctions[constants.placeBuy] = placeDecisionOrder;
executeFunctions[constants.placeSell] = placeDecisionOrder;
executeFunctions[constants.cancel] = cancelOrder;
executeFunctions[constants.updateBuy] = updateOrder;
executeFunctions[constants.updateSell] = updateOrder;*/
exports.executeFunctions = executeFunctions;

exports.init = function() {

}

exports.continue = function() {
    return true;
}