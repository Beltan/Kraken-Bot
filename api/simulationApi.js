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

var getOtherType = function(type) {
    if(type == constants.placeSell)
        return constants.placeBuy;
    else if(type == constants.placeBuy)
        return constants.placeSell;

    console.log("There is an error in the decision");
    return null;
}

// Order functions
var placeOrder = function(type, quantity,  price1, price2 = null, userref = null,
        closePrice1 = null, closePrice2 = null) {
    
    api.txid++;

    var closeOrder = null;
    if(closePrice1 != null) {
        closeOrder = {price1 : closePrice1, price2 : closePrice2};
    }
    
    var order = {txid : api.txid, price : price1, price2: price2, volume : quantity, 
        userref : userref, type : type, closeOrder : closeOrder};
    
    //init values order
    order.vol_exec = 0;
    order.state = constants.pending;
    order.createdTime = new Date();
    
    api.openOrders[api.txid] = order;

    return order;
}

// this function should decide what is the next order to execute
var getNextTxidOrder = function(type) {

    var txid = -1;
    var value;
    
    for(i in api.openOrders) {
        var order = api.openOrders[i];
        if(type == constants.placeSell && order.state == constants.pending) {
            if(txid == -1 || order.price < value || order.price2 < value) {
                txid = i;
            }
        }
        else if(type == constants.placeBuy && order.state == constants.pending) {
            if(txid == -1 || order.price > value || order.price2 > value) {
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
    order.vol_exec += quantity;
    if(Math.abs(order.vol_exec - order.volume) <= 0.1) {
        api.openOrders[txid].state = constants.closed;
        cont = true;
        
        // create the new order if present
        if(order.closeOrder != null) {
            placeOrder(getOtherType(order.type), order.volume,
                order.closeOrder.price1, order.closeOrder.price2, order.userref);
        }
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
    var quantity = Math.min(order.volume, randomBuy);

    var commission = quantity * 0.0015;
    var realQuantity = quantity - commission;

    // update balances
    api.balance[api.second] = api.balance[api.second] - commission - realQuantity;
    api.balance[api.first] = api.balance[api.first] + realQuantity / order.price;

    return quantity;
}

var sell = function(order) {
    var randomBuy = getRandomInt(1000, 3000);
    var quantity = Math.min(order.volume, randomBuy);

    var commission = quantity * order.price * 0.0015;

    // update balances
    api.balance[api.second] = api.balance[api.second] + quantity * order.price - commission;
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

// and then we add the functions to the object
var executeFunctions = {};
executeFunctions[constants.placeBuy] = placeDecisionOrder;
executeFunctions[constants.placeSell] = placeDecisionOrder;
executeFunctions[constants.cancelBuy] = cancelOrder;
executeFunctions[constants.cancelSell] = cancelOrder;
exports.executeFunctions = executeFunctions;

exports.getValues = function() {
    var value;

    if (api.index < api.historic.length){
        value = api.historic[api.index];
    } 
    else {
        console.log("No more values for simulation");
        return;
    }

    var oldValue = value;
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