config = require('./config').ia;
const fs = require('fs');

var localHistory = [];
var lastDeleted;
var localMin = Infinity;
var pendingBuy = 0;

function updateHistory(value) {
    if (localHistory.length < config.local){
        localHistory.push(value);
    }else{
        lastDeleted = localHistory.shift();
        localHistory.push(value);
    }
}

function updateLocalMinimum(value) {
    if (lastDeleted == localMin) {
        localMin = Infinity;
        for (j = 0; j < localHistory.length; j++) {
            if (localMin > localHistory[j]){
                localMin = localHistory[j];
            }
        }
    }else {
        if (localMin > value) {
            localMin = value;
        }
    }
}

function updateBuys(bid, openTrades) {

    var lowestBuy = Infinity;

    for (i = 0; i < openTrades.length; i++) {
        if (openTrades[i]['buyPrice'] <= lowestBuy) {
            lowestBuy = openTrades[i]['buyPrice'];
        }
    }
    var buyIncrease = 100 * (bid - localMin) / localMin;
    var parameters = {lowestBuy, buyIncrease};
    return parameters;
}

// openBuyOrders tracks all the buy orders that are placed until they are canceled or their respective sell order is completely filled
// openSellOrders tracks all the sell orders that are placed until they are filled
// both vectors should contain additional parameters, mainly the openBuyOrders

function updateOrderStatus(n) {
    pendingBuy = n.openBuyOrders[n.openBuyOrders.length - 1]['missing volume'];
    var executedVolume = n.openBuyOrders[n.openBuyOrders.length - 1]['executed volume'];
    var orderStatus = 'standby';
    if (n.openTrades.length == 0 && n.openBuyOrders.length == 0 && n.openSellOrders.length == 0) {
        orderStatus = 'no orders placed';
    }else if (n.openTrades.length == 0 && n.openBuyOrders.length > 0) {
        orderStatus = 'buy order placed';
    }else if (n.openTrades.length > 0 && n.openBuyOrders.length == 0 && (n.openTrades.length > n.openSellOrders.length)) {
        orderStatus = 'buy order filled';
    }else if (n.openTrades.length > 0 && n.openSellOrders.length > 0 && (n.openTrades.length == n.openSellOrders.length)) {
        orderStatus = 'sell order placed';
    }else if (n.openBuyOrders.length > 0 && (n.openTrades.length < n.openBuyOrders.length)) {
        orderStatus = 'buy order pending';
    }else if (missingVolume != 0 && executedVolume != 0) {
        orderStatus = 'buy order partial fill';
    }
    return orderStatus;
}

// pending to init config.spread and config.krakenMin depending on the name of the crypto traded.
// pending to init orderStatus to no orders placed.

//n -> input, p -> parameters
function updateDecision(n, p, orderStatus) {
    var decision = {'type' : 'standby'};
    var buyConditions = false;

    // function that decides and returns a boolean whether the buyConditions are met or not? well done Sherlock
    if ((p.buyIncrease >= config.lowBuy) && (p.buyIncrease <= config.highBuy)) {
        buyConditions = true;
    }

    // buy balance is repetead lot's of times.. so what!?
    if (orderStatus == 'standby') {
    }else if ((orderStatus == 'no orders placed') && buyConditions) {
        var buyBalance = n.balance / (config.maxBuy - n.openTrades.length);
        decision = {'type' : 'place buy order', 'price' : n.bid + config.spread, 'quantity' : buyBalance};
    }else if ((orderStatus == 'buy order placed') && buyConditions) {
        var buyBalance = n.balance / (config.maxBuy - n.openTrades.length);
        decision = {'type' : 'update buy order', 'price' : n.bid + config.spread, 'quantity' : buyBalance};
    }else if ((orderStatus == 'buy order placed') && !buyConditions) {
        decision = {'type' : 'cancel buy order'};
    }else if (orderStatus == 'buy order filled') {
        var deleteIndex = n.openTrades.findIndex(i => i.buyPrice == p.lowestBuy);
        var sellBalance = n.openTrades[deleteIndex]['quantity'];
        decision = {'type' : 'place sell order', 'price' : p.lowestBuy * (1 + config.sellPositive / 100),
            'price2' : p.lowestBuy * (1 + config.sellNegative / 100), 'quantity' : sellBalance};
    }else if ((orderStatus == 'sell order placed') && buyConditions && (n.openTrades.length < config.maxBuy)) {
        var buyBalance = n.balance / (config.maxBuy - n.openTrades.length);
        decision = {'type' : 'place buy order', 'price' : n.bid + config.spread, 'quantity' : buyBalance};
    }else if ((orderStatus == 'buy order pending') && !buyConditions) {
        decision = {'type' : 'cancel buy order'};
    }else if ((orderStatus == 'buy order partial fill') && buyConditions && pendingBuy > (config.krakenMin * (n.bid + config.spread))) {
        var buyBalance = pendingBuy;
        decision = {'type' : 'update buy order', 'price' : n.bid + config.spread, 'quantity' : buyBalance};
    }else if ((orderStatus == 'buy order partial fill') && !buyConditions) {
        decision = {'type' : 'cancel buy order'};
    }

    return decision;
}

// input -> {bid, ask, value, openTrades, balance, openBuyOrders, openSellOrders}
// output -> {type, price, price2, quantity, index};
exports.decide = function(input) {
    updateHistory(input.value);
    updateLocalMinimum(input.value);
    var parameters = updateBuys(input.bid, input.openTrades);
    var orderStatus = updateOrderStatus(input);
    var decision = updateDecision(input, parameters, orderStatus);
    return decision;
}
