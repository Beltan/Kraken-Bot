config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

var localHistory = [];
var nextDeletion = 0;
var localMin = Infinity;

function updateHistory() {
    if (localHistory.length < config.local){
        localHistory.push(value);
    }else{
        localHistory.shift();
        localHistory.push(value);
    }
}

function updateLocalMinimum() {
    if (nextDeletion == localMin) {
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
    nextDeletion = localHistory[0];
}

function updateBuys() {
    if (0 <= openTrades.length) {
        lowestBuy = Infinity;
        highestBuy = 0;
    }
    for (i = 0; i < openTrades.length; i++) {
        if (openTrades[i]['value'] <= lowestBuy) {
            lowestBuy = openTrades[i]['value'];
        }
        if (openTrades[i]['value'] >= highestBuy) {
            highestBuy = openTrades[i]['value'];
        }
    }
    sellIncreaseLose = 100 * (bid - highestBuy) / highestBuy;
    sellIncreaseWin = 100 * (bid - lowestBuy) / lowestBuy;
    buyIncrease = 100 * (bid - localMin) / localMin;
    parameters = {lowestBuy, highestBuy, sellIncreaseLose, sellIncreaseWin, buyIncrease};
    return parameters;
}

function updateDecision(parameters) {
    if ((openTrades.length < config.maxBuy) && (openTrades.length == 0 || lowestBuy > ask * (1 + config.multipleBuys / 100)) && (buyIncrease >= config.lowBuy) && (buyIncrease <= config.highBuy)) {
        buyBalance = balance / (config.maxBuy - openTrades.length);
        decision = {'type' : 'buy', 'price' : ask, 'quantity' : buyBalance};
    }else if ((openTrades.length > 0) && (sellIncreaseWin >= config.sellPositive)) {
        deleteIndex = openTrades.findIndex(i => i.value == lowestBuy);
        sellBalance = openTrades[deleteIndex]['quantity'];
        decision = {'type' : 'sell', 'price' : lowestBuy * (1 + config.sellPositive / 100), 'quantity' : sellBalance, 'index' : deleteIndex};
    }else if ((openTrades.length > 0) && (sellIncreaseLose <= config.sellNegative)) {
        deleteIndex = openTrades.findIndex(i => i.value == highestBuy);
        sellBalance = openTrades[deleteIndex]['quantity'];
        if (nextbid < bid) {
            bid = nextbid;
        }
        decision = {'type' : 'sell', 'price' : bid, 'quantity' : sellBalance, 'index' : deleteIndex};
    }else {
        decision = {'type' : 'standby', 'price' : 0, 'quantity' : 0};
    }
    return decision;
}

exports.decide = function(values) {
    updateHistory();
    updateLocalMinimum();
    updateBuys();
    decision = updateDecision(parameters);
    return decision;
}