config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

var localHistory = [];
var lastDeleted;
var localMin = Infinity;

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
    var highestBuy = 0;

    for (i = 0; i < openTrades.length; i++) {
        if (openTrades[i]['buyPrice'] <= lowestBuy) {
            lowestBuy = openTrades[i]['buyPrice'];
        }
        if (openTrades[i]['buyPrice'] >= highestBuy) {
            highestBuy = openTrades[i]['buyPrice'];
        }
    }
    var sellIncreaseLose = 100 * (bid - highestBuy) / highestBuy;
    var sellIncreaseWin = 100 * (bid - lowestBuy) / lowestBuy;
    var buyIncrease = 100 * (bid - localMin) / localMin;
    var parameters = {lowestBuy, highestBuy, sellIncreaseLose, sellIncreaseWin, buyIncrease};
    return parameters;
}

function updateOrderStatus() {

}

// pending to init config.spread and config.krakenMin depending on the name of the crypto traded.
// pending to init orderStatus to no orders placed.
// maybe track the ids of orders placed as it is done with the buys performed

//n -> input, p -> parameters
function updateDecision(n, p) {
    var decision = {'type' : 'standby'};
    var buyConditions = false;
    if ((p.buyIncrease >= config.lowBuy) && (p.buyIncrease <= config.highBuy)) {
        buyConditions = true;
    }
    if ((orderStatus == 'no orders placed') && buyConditions) {
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
    }else if ((orderStatus == 'sell order filled') && buyConditions) {
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

// input -> {bid, ask, value, openTrades, balance}
// output -> {type, price, quantity, index};
exports.decide = function(input) {
    updateHistory(input.value);
    updateLocalMinimum(input.value);
    var parameters = updateBuys(input.bid, input.openTrades);
    var decision = updateDecision(input, parameters);
    return decision;
}
