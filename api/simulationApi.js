let store = require('../store');
const helper = require('../helper');
const constants = require('../constants');
const config = require('../config').api;
const broker = require('../config').broker;
const simulation = require('../config').simulation;
const logger = require('../logger').logger();
const Binance = require('node-binance-api');
const math = require('mathjs');
const binance = new Binance().options({
    APIKEY: config.key,
    APISECRET: config.secret
});

let openOrders = {};
let balance = {};
let rnd_id = 0;

let updateOrders = function(){
    if(!store.bid || !store.ask) return;

    for (let order in openOrders){
        if (order.type == 'buy' && order.price >= store.ask){
            let total = math.multiply(decision.quantity, order.price); 
            balance[broker.pair[0].second.onOrder] -= total;
            balance[broker.pair[0].first.available] += decision.quantity;
            delete openOrders[order.txid];
        }
        if (order.type == 'sell' && order.price <= store.bid){
            let total = math.multiply(decision.quantity, order.price);
            balance[broker.pair[0].first.onOrder] -= decision.quantity;
            balance[broker.pair[0].second.available] += total;
            delete openOrders[order.txid];
        }
    }
}

exports.getValues = async function () {
    updateOrders();
    
    await helper.sleep(1000);

    try {
        store.depth = await binance.depth(helper.getPair(broker.pair[0]));
        store.bid = math.min(Object.keys(store.depth.bids));
        store.ask = math.max(Object.keys(store.depth.asks));
        store.balance = balance;
        store.openorders = openOrders;
        for(let i in config.candles) {
            const candle = config.candles[i];
            store.candles[candle] = await helper.getHistoric(helper.getPair(broker.pair[0]), candle);
        }

    } catch (e) {
        logger.error('Error while retrieving info, trying again... -> ' + e);
    }

    return store;
}

let placeBuy = async function(decision) {
    let total = math.multiply(decision.price, decision.quantity);
    if (total <= balance[broker.pair[0].second]){
        balance[broker.pair[0].second.available] -= total;
        balance[broker.pair[0].second.onOrder] += total;
        decision.txid = rnd_id++;
        openOrders[rnd_id] = decision;
    }
    else{
        logger.error('Not enough funds to place this buy order');
    }
}

let placeSell = async function(decision) {
    if (total <= decision.quantity){
        balance[broker.pair[0].first.available] -= decision.quantity;
        balance[broker.pair[0].first.onOrder] += decision.quantity;
        decision.txid = rnd_id++;
        openOrders[rnd_id] = decision;
    }
    else{
        logger.error('Not enough funds to place this sell order');
    }
}

let cancelOrder = async function(decision) {
    let type = decision.order;
    let txid = decision.txid;
    
    if (txid in openOrders) {
        delete openOrders[txid];
    }
    else{
        logger.error('Error while placing ' + type + ', ' + type + ' not placed. Trying again... -> ' + e);
    }
    return order;
}

let updateOrder = function(decision) {
    cancelOrder(decision);
    let order = placeOrder(decision);
    return order
}

// and then we add the functions to the object
let executeFunctions = {};
executeFunctions[constants.placeBuy] = placeBuy;
executeFunctions[constants.placeSell] = placeSell;
executeFunctions[constants.cancel] = cancelOrder;
executeFunctions[constants.updateBuy] = updateOrder;
executeFunctions[constants.updateSell] = updateOrder;
exports.executeFunctions = executeFunctions;

exports.init = function() {
    for (let key in simulation.startingBalance){
        balance[key] = {available: simulation.startingBalance[key], onOrder: 0}
    }
}

exports.continue = function() {
    return true;
}