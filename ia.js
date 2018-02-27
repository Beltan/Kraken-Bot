config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);


/* The idea here is to pass bid, ask, openTrades, buyPrice...
 you shouldn't ask nothing to the api, therefore there shouldn't be any,
 api.whatever. If you need them, pass them by parameter, and NEVER modify them,
 the api should be responsible about that.

 Also the returned decision should be like an instruction:
 {decision : "buy", buyOrder: value, placeOrder : value}
 and you are like ordering to the api what it should do: I want you to buy an order with this value,
 and if there aren't any, then place one to this value.
 THIS WAS JUST AN EXAMPLE, you can think a little what is the best "instruction"! ;)
*/

/* Localhistory should be a private var used by the IA, it should be declared and only modified
 inside this class:

var localHistory = [];

and also have a init function, so we can init it if we want!!

exports.init = function(history) {
    localHistory = history;
}

PLEAE FOR THE SAKE OF CLARITY do smaller functions with smaller responsabilities.
One could be:

function updateHistory(value) {
    if (localHistory.length < config.local){
        localHistory.push(value);
    }else{
        localHistory.shift();
        localHistory.push(value);
    }
}

and another

function getMinimumLocal() {
    localMin = Infinity;
    for (j = 0; j < ia.localHistory.length; j++) {
        if (ia.localMin > ia.localHistory[j]){
            ia.localMin = ia.localHistory[j]
        }
    }

    return localMin;
}

 that but the way, the avobe function is very inneficient, there is a clever way of 
 maintaining the local minimum, but that's out of the scope of this comments :P 

 There are some more cases... that would be nice to have a function

*/

exports.decide = function({bid, ask}) {
    
    value = (bid + ask) / 2;
    if (ia.localHistory.length < config.local){
        ia.localHistory.push(value);
    }else{
        ia.localHistory.shift();
        ia.localHistory.push(value);
    }
    ia.localMin = Infinity;
    for (j = 0; j < ia.localHistory.length; j++) {
        if (ia.localMin > ia.localHistory[j]){
            ia.localMin = ia.localHistory[j]
        }
    }
    if (0 < api.openTrades.length) {
        api.lowestBuy = Infinity;
        api.highestBuy = 0;
    }
    for (i = 0; i < api.openTrades.length; i++) {
        if (api.openTrades[i]['value'] <= api.lowestBuy) {
            api.lowestBuy = api.openTrades[i]['value'];
        }
        if (api.openTrades[i]['value'] >= api.highestBuy) {
            api.highestBuy = api.openTrades[i]['value'];
        }
    }
    ia.sellIncreaseLose = 100 * (bid - api.highestBuy) / api.highestBuy;
    ia.sellIncreaseWin = 100 * (bid - api.lowestBuy) / api.lowestBuy;
    ia.buyIncrease = 100 * (bid - ia.localMin) / ia.localMin;
    if ((api.buyCounter < config.maxBuy) && (api.buyCounter == 0 || api.lowestBuy > ask * (1 + config.multipleBuys / 100)) && (ia.buyIncrease >= config.lowBuy) && (ia.buyIncrease <= config.highBuy)) {
        decision = 'buy';
        api.buyPrice = ask;
    }else if ((api.buyCounter > 0) && (ia.sellIncreaseWin >= config.sellPositive)) {
        decision = 'sell';
        api.sellPrice = bid;
        deleteIndex = api.openTrades.findIndex(i => i.value == api.lowestBuy);
        api.sellBalance = api.openTrades[deleteIndex]['quantity'];
        api.openTrades.splice(deleteIndex, 1);
    }else if ((api.buyCounter > 0) && (ia.sellIncreaseLose <= config.sellNegative)) {
        decision = 'sell';
        api.sellPrice = bid;
        deleteIndex = api.openTrades.findIndex(i => i.value == api.highestBuy);
        api.sellBalance = api.openTrades[deleteIndex]['quantity'];
        api.openTrades.splice(deleteIndex, 1);
    }else {
        decision = 'standby';
    }
    api.decision = decision;
    return decision;
}