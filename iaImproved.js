config = require('./config').ia;
const fs = require('fs');

var ia = {};

function updateHistory(value) {
    if (ia.localHistory.length < config.local){
        ia.localHistory.push(value);
    }else{
        ia.lastDeleted = ia.localHistory.shift();
        ia.localHistory.push(value);
    }
}

function updateLocalMinimum(value) {
    if (ia.lastDeleted == ia.localMin) {
        ia.localMin = Infinity;
        for (j = 0; j < ia.localHistory.length; j++) {
            if (ia.localMin > ia.localHistory[j]){
                ia.localMin = ia.localHistory[j];
            }
        }
    }else {
        if (ia.localMin > value) {
            ia.localMin = value;
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
    var buyIncrease = 100 * (bid - ia.localMin) / ia.localMin;
    var parameters = {lowestBuy, buyIncrease};
    return parameters;
}

/*
The vectors of openTrades, openBuyOrders and openSellOrders will be replaced with a vector called openOrders
This vector will track all the open orders (so it can contain 0-1 buy orders and 0-10 sell orders). It could contain 2 buy orders in some cases, but atleast 1 would be already canceled and therefore deleted.
The info of the vector will be type (buy/sell), status (pending, partial...), id, price, price2 (maybe some other important info that kraken returns)
This vector will be updated by the ia with the information that the ia decides and with what the api returns from kraken.
The ia will send to the api the ids of all the orders in the vector and in the next iteration will update the vector with the info received
After the update it will search for canceled and filled orders and it will delete them from the vector
The ia does not need further info besides the parameters that it already has like bid, ask, value and balance
*/

// openBuyOrders tracks all the buy orders that are placed until they are canceled or their respective sell order is completely filled
// openSellOrders tracks all the sell orders that are placed until they are filled
// both vectors should contain additional parameters, mainly the openBuyOrders

function updateOrderStatus(n) {
    ia.pendingBuy = n.openBuyOrders[n.openBuyOrders.length - 1]['missing volume'];
    var executedVolume = n.openBuyOrders[n.openBuyOrders.length - 1]['executed volume'];
    var orderStatus = 'standby';
    if (n.openTrades.length == 0 && n.openBuyOrders.length == 0 && n.openSellOrders.length == 0) {
        orderStatus = 'no orders placed';
    }else if (n.openTrades.length == 0 && n.openBuyOrders.length > 0) {
        orderStatus = 'buy order placed';
    }else if (n.openTrades.length > 0 && (n.openTrades.length == n.openBuyOrders.length)) {
        orderStatus = 'buy order filled';
    }else if (n.openTrades.length > 0 && (n.openTrades.length == n.openSellOrders.length)) {
        orderStatus = 'sell order placed';
    }else if (n.openBuyOrders.length > 0 && (n.openTrades.length < n.openBuyOrders.length)) {
        if (ia.pendingBuy != 0 && executedVolume != 0){
        orderStatus = 'buy order partial fill';
        }else {
        orderStatus = 'buy order pending';
        }
    }
    return orderStatus;
}

function buyConditions(p) {
    var buyConditions = false;
    if ((p.buyIncrease >= config.lowBuy) && (p.buyIncrease <= config.highBuy)) {
        buyConditions = true;
    }
    return buyConditions;
}

//n -> input, p -> parameters
function updateDecision(n, p, orderStatus) {
    var decision = {'type' : 'standby'};
    var buyConditions = buyConditions (p);

    // buy balance is repetead lot's of times..
    if (orderStatus == 'standby') {
    }else if (!buyConditions && (orderStatus == 'buy order placed' || orderStatus == 'buy order pending' || orderStatus == 'buy order partial fill')) {
        decision = {'type' : "cancelBuy"};
    }else if ((orderStatus == 'no orders placed') && buyConditions) {
        var buyBalance = n.balance / (config.maxBuy - n.openTrades.length);
        decision = {'type' : 'placeBuy', 'price' : n.bid + config.spread, 'quantity' : buyBalance};
    }else if ((orderStatus == 'buy order placed') && buyConditions) {
        var buyBalance = n.balance / (config.maxBuy - n.openTrades.length);
        decision = {'type' : 'updateBuy', 'price' : n.bid + ia.spread, 'quantity' : buyBalance};
    }else if (orderStatus == 'buy order filled') {
        var deleteIndex = n.openTrades.findIndex(i => i.buyPrice == p.lowestBuy);
        var sellBalance = n.openTrades[deleteIndex]['quantity'];
        decision = {'type' : 'placeSell', 'price' : p.lowestBuy * (1 + config.sellPositive / 100),
            'price2' : p.lowestBuy * (1 + config.sellNegative / 100), 'quantity' : sellBalance};
    }else if ((orderStatus == 'sell order') && buyConditions && (n.openTrades.length < config.maxBuy)) {
        var buyBalance = n.balance / (config.maxBuy - n.openTrades.length);
        decision = {'type' : 'placeBuy', 'price' : n.bid + ia.spread, 'quantity' : buyBalance};
    }else if ((orderStatus == 'buy order partial fill') && buyConditions && ia.pendingBuy > (ia.krakenMin * (n.bid + ia.spread))) {
        var buyBalance = ia.pendingBuy;
        decision = {'type' : 'updateBuy', 'price' : n.bid + ia.spread, 'quantity' : buyBalance};
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

exports.initialize = function(pair) {
    ia.localHistory = [];
    ia.lastDeleted = 0;
    ia.localMin = Infinity;
    ia.pendingBuy = 0;
    ia.krakenMin = eval('config.krakenMin' + pair.substring(0, 3));
    ia.spread = eval('config.spread' + pair.substring(0, 3));
}
