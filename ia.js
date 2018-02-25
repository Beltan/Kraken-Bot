config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

exports.decide = function(value) {
    if (!api.realmode) {
        ia.bid = value * 0.9995;
        ia.ask = value * 1.0005;
    }else {} //define bid and ask for real mode
    if (ia.localHistory.length < config.local){
        ia.localHistory.push(value);
    }else{
        ia.localHistory.pop();
        ia.localHistory.unshift(value);
    }
    ia.localMin = Infinity;
    for (j = 0; j < ia.localHistory.length; j++) {
        if (ia.localMin > ia.localHistory[j]){
            ia.localMin = ia.localHistory[j]
        }
    }
    ia.sellIncrease = 100 * (ia.bid - api.buyPrice) / api.buyPrice;
    ia.buyIncrease = 100 * (ia.ask - ia.localMin) / ia.localMin;
    if (!api.longPosition && (ia.buyIncrease >= config.lowBuy && ia.buyIncrease <= config.highBuy))
        decision = 'buy';
    else if (api.longPosition && (ia.sellIncrease >= config.sellPositive || ia.sellIncrease <= config.sellNegative))
        decision = 'sell';
    else {
        decision = 'standby';
    }
    return decision;
}