config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

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