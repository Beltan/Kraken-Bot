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
    ia.sellIncrease = 100 * (bid - api.buyPrice) / api.buyPrice;
    ia.buyIncrease = 100 * (bid - ia.localMin) / ia.localMin;
    api.previousDecision = api.decision;
    if (!api.longPosition && (ia.buyIncrease >= config.lowBuy && ia.buyIncrease <= config.highBuy)) {
        decision = 'buy';
        api.buyPrice = ask;
    }else if (api.longPosition && (ia.sellIncrease >= config.sellPositive || ia.sellIncrease <= config.sellNegative)) {
        decision = 'sell';
        api.sellPrice = bid;
    }else {
        decision = 'standby';
    }
    api.decision = decision;
    return decision;
}