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
var placeOrder = function(type, quantity,  price1, price2 = null, userref = null) {
    
    api.txid++;
    
    var order = {txid : api.txid, price : price1, price2: price2, volume : quantity, 
        userref : userref, type : type};
    
    //init values order
    order.vol_exec = 0;
    order.state = constants.pending;
    order.createdTime = new Date();
    
    api.openOrders[api.txid] = order;

    return order;
}

var processOrder = function(txid, updatedValue) {
    var order = api.openOrders[txid];
    var quantity = 0;

    // update the balance
    if(order.type == constants.placeBuy && updatedValue <= order.price) {
        quantity = buy(order, updatedValue);
    }
    else if(order.type == constants.placeSell && decisionValue >= 0) {
        quantity = sell(order, updatedValue);
    }

    // update the order       
    order.vol_exec += quantity;
    if(Math.abs(order.vol_exec - order.volume) <= 0.1) {
        api.openOrders[txid].state = constants.closed;
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
    var price = order.price;

    var commission = quantity * price * 0.0015;
    var realQuantity = quantity - commission;

    // update balances
    api.balance[api.second] = api.balance[api.second] - commission - realQuantity;
    api.balance[api.first] = api.balance[api.first] + realQuantity / price;

    return quantity;
}

var sell = function(order) {
    var quantity = order.volume, randomBuy;

    var price;
    order.price <= value ? price = value : price = order.price2;

    var commission = quantity * price * 0.0015;

    // update balances
    api.balance[api.second] = api.balance[api.second] + quantity * price - commission;
    api.balance[api.first] = api.balance[api.first] - quantity;

    return quantity;
}

// Decision functions: For each decision we declare a function
var placeDecisionOrder = function(decision) {
    return placeOrder(decision.type, decision.quantity, decision.price, decision.price2, decision.userref);
}

var cancelOrder = function(decision) {
    api.openOrders[decision.txid].state = constants.canceled;
}

var updateOrder = function(decision) {
    cancelOrder(decision);
    return placeOrder(decision.type, decision.quantity, decision.price, decision.price2, decision.userref);
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
    var values = {bid, ask, value, balance, "openOrders" : api.openOrders};
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