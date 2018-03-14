config = require('./config').ia;
const fs = require('fs');

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

//n -> input, p -> parameters
function updateDecision(n, p) {
    var decision = {'type' : 'standby'};

    if ((n.openTrades.length < config.maxBuy) && (n.openTrades.length == 0 || 
            p.lowestBuy > n.ask * (1 + config.multipleBuys / 100)) && (p.buyIncrease >= config.lowBuy) && 
            (p.buyIncrease <= config.highBuy)) {

        var buyBalance = n.balance / (config.maxBuy - n.openTrades.length);
        decision = {'type' : 'placeBuy', 'price' : n.ask, 'quantity' : buyBalance};

    } else if ((n.openTrades.length > 0) && (p.sellIncreaseWin >= config.sellPositive)) {

        var deleteIndex = n.openTrades.findIndex(i => i.buyPrice == p.lowestBuy);
        var sellBalance = n.openTrades[deleteIndex]['quantity'];
        decision = {'type' : 'placeSell', 'price' : p.lowestBuy * (1 + config.sellPositive / 100), 
            'quantity' : sellBalance, 'index' : deleteIndex};

    } else if ((n.openTrades.length > 0) && (p.sellIncreaseLose <= config.sellNegative)) {

        var deleteIndex = n.openTrades.findIndex(i => i.buyPrice == p.highestBuy);
        var sellBalance = n.openTrades[deleteIndex]['quantity'];
        var bid = n.bid;
        decision = {'type' : 'placeSell', 'price' : bid, 'quantity' : sellBalance, 'index' : deleteIndex};

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
