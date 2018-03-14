const fs = require('fs');
var constants = require('./../constants');

var api = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

var csvToArray = function() {
    var stuff = fs.readFileSync('./historics/' + api.pair + '.csv', 'utf8');
    api.historic = stuff.split(',');
}

// Order functions
var placeOrder = function(type, price, quantity, extId = null) {
    api.txid++;
    
    var order = {txid : api.txid, price : price, quantity : quantity, 
        extId : extId, type : type};
    
    //init values order
    order.consumed = 0;
    order.createdTime = new Date();
    
    api.openOrders[api.txid] = order;

    return order;
}

var getNextTxidOrder = function(type) {

    var txid = -1;
    var value;
    
    for(i in api.openOrders) {
        var order = api.openOrders[i];
        if(type == constants.placeSell) {
            if(txid == -1 || order.price < value) {
                txid = i;
            }
        }
        else if(type == constants.placeBuy) {
            if(txid == -1 || order.price > value) {
                txid = i;
            }
        }
    }
    return txid;
}

var processOrder = function(txid, updatedValue) {
    var order = api.openOrders[txid];
    var decisionValue = order.price - updatedValue;
    var cont = false;

    var quantity = 0;

    // update the balance
    if(order.type == constants.placeBuy && decisionValue <= 0) {
        quantity = buy(order);
        updatedValue = order.price;
    }
    else if(order.type == constants.placeSell && decisionValue >= 0) {
        quantity = sell(order);
        updatedValue = order.price;
    }

    // update the order       
    order.consumed += quantity;
    if(Math.abs(order.consumed - order.quantity) <= 0.1) {
        delete api.openOrders[txid];
        cont = true;
    }

    return {cont, updatedValue};
}

var update = function(newValue) {

    var updatedValue = newValue;

    // process placeBuy orders
    var nextTxid = getNextTxidOrder(constants.placeBuy);
    var cont = true;
    while(nextTxid > -1 && cont) {
        ({cont, updatedValue} = processOrder(nextTxid, updatedValue));
        if(cont) nextTxid = getNextTxidOrder(api.openOrders, constants.placeBuy);
    }

    // process placeSell orders
    var nextTxid = getNextTxidOrder(api.openOrders, constants.placeSell);
    var cont = true;
    while(nextTxid > -1 && cont) {
        ({cont, updatedValue} = processOrder(nextTxid, updatedValue));
        if(cont) nextTxid = getNextTxidOrder(api.openOrders, constants.placeSell);
    }
    
    return updatedValue;
}

// Sell and buy modify the order
var buy = function(order) {

    var randomBuy = getRandomInt(1000, 3000);
    var quantity = Math.min(order.quantity, randomBuy);

    var commission = quantity * 0.0015;
    var realQuantity = quantity - commission;

    // update balances
    api.balance[api.second] = api.balance[api.second] - commission - realQuantity;
    api.balance[api.first] = api.balance[api.first] + realQuantity / order.price;

    return quantity;
}

var sell = function(order) {
    var randomBuy = getRandomInt(1000, 3000);
    var quantity = Math.min(order.quantity, randomBuy);

    var commission = quantity * order.price * 0.0015;

    // update balances
    api.balance[api.second] = api.balance[api.second] + quantity * order.price - commission;
    api.balance[api.first] = api.balance[api.first] - quantity;

    return quantity;
}

// Decision functions: For each decision we declare a function
var placeDecisionOrder = function(decision) {
    return placeOrder(decision.type, decision.price, decision.quantity, decision.extId);
}

// and then we add the functions to the object
var executeFunctions = {};
executeFunctions[constants.placeBuy] = placeDecisionOrder;
executeFunctions[constants.placeSell] = placeDecisionOrder;
exports.executeFunctions = executeFunctions;

exports.getValues = function() {
    var value;
    if (api.index < api.historic.length){
        value = api.historic[api.index];
        api.index++;        
    }

    value = update(value);

    var bid = value * 0.9995;
    var ask = value * 1.0005;
    var openTrades = Object.values(api.openOrders);
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
    api.txid = 0;
    api.openOrders = {};

    csvToArray();
}

exports.continue = function() {
    return api.index < api.historic.length;
}