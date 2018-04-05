const fs = require('fs');
var constants = require('../constants');

var api = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

var csvToArray = function() {
    var stuff = fs.readFileSync('./historics/' + api.pair + '.csv', 'utf8');
    api.historic = stuff.split(',');
}

// Order functions
var placeOrder = function({type, ordertype, quantity,  price, price2, userref = null}) {
    
    api.txid++;
    
    var descr = {type, ordertype, price,  price2};

    var order = {txid : api.txid, price, vol : quantity, userref, descr};
    
    //init values order
    order.vol_exec = 0;
    order.status = constants.open;
    order.createdTime = new Date();
    
    api.openOrders[api.txid] = order;

    return order;
}

var processOrder = function(txid, updatedValue) {
    var order = api.openOrders[txid];
    var quantity = 0;
    var price;

    // update the balance
    if(order.type == constants.placeBuy && updatedValue <= order.price) {
        ({price, quantity} = buy(order, updatedValue));
    }
    else if(order.type == constants.placeSell && decisionValue >= 0) {
        ({price, quantity} = sell(order, updatedValue));
    }

    // update the order       
    order.vol_exec += quantity;
    //this should be the mean
    order.price = price;
    if(Math.abs(order.vol_exec - order.volume) <= 0.1) {
        api.openOrders[txid].status = constants.closed;
    }

    return  updatedValue;
}

var update = function(newValue) {

    var updatedValue = newValue;

    // process orders
    for(var nextTxid in api.openOrders) {
        updatedValue = processOrder(nextTxid, updatedValue);
    }
    
    // updated value is useless right now, but can be usefull in the future, so I let it
    return updatedValue;
}

var buy = function(order, value) {

    // get the real quantity
    var quantity = order.volume;
    var price = order.descr.price;

    var commission = quantity * price * 0.0015;
    var realQuantity = quantity - commission;

    // update balances
    api.balance[api.second] = api.balance[api.second] - commission - realQuantity;
    api.balance[api.first] = api.balance[api.first] + realQuantity / price;

    return {price, quantity};
}

var sell = function(order) {
    var quantity = order.volume, randomBuy;

    var price;
    order.price <= value ? price = value : price = order.price2;

    var commission = quantity * price * 0.0015;

    // update balances
    api.balance[api.second] = api.balance[api.second] + quantity * price - commission;
    api.balance[api.first] = api.balance[api.first] - quantity;

    return {price, quantity};
}

// Decision functions: For each decision we declare a function
var placeDecisionOrder = function(decision) {
    return placeOrder(decision);
}

var cancelOrder = function(decision) {
    api.openOrders[decision.txid].status = constants.canceled;
}

var updateOrder = function(decision) {
    cancelOrder(decision);
    return placeOrder(decision);
}

// and then we add the functions to the object
var executeFunctions = {};
executeFunctions[constants.placeBuy] = placeDecisionOrder;
executeFunctions[constants.placeSell] = placeDecisionOrder;
executeFunctions[constants.cancelBuy] = cancelOrder;
executeFunctions[constants.cancelSell] = cancelOrder;
executeFunctions[constants.updateOrder] = updateOrder;
exports.executeFunctions = executeFunctions;

exports.getValues = function() {
    var value;

    if (api.index < api.historic.length){
        value = api.historic[api.index];
        api.index++;
    } 
    else {
        console.log("No more values for simulation");
        return;
    }

    var oldValue = value;
    value = update(value);

    var bid = value * 0.9995;
    var ask = value * 1.0005;
    var balance = api.balance[api.second];
    var values = {bid, ask, value, balance, openOrders : api.openOrders};
    return values;
}

exports.initialize = function() {
    var pair = config.pair;
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