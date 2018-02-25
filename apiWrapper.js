config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

exports.execute = function(decision) {
    if (decision == 'standby') {}
    else if (config.realMode) {
        if (decision == 'buy') {
            if (api.spread < 0.25) {}else {
                console.log('Failed to buy, spread is too large');
            }
        }else if (decision == 'sell') {
            if (api.spread < 0.5) {}else{
            console.log('Failed to sell, spread is too large');
            }
        }
    }else {
        if (decision == 'buy') {
            commission = api.balance[api.second] * 0.0015;
            api.balance[api.second] = api.balance[api.second] - commission;
            api.balance[api.first] = api.balance[api.second] / api.buyPrice;
            api.balance[api.second] = 0;
            api.longPosition = true;
            var history = {'type' : 'buy', 'value' : api.buyPrice, 'commission' : commission, 'balance' : api.balance[api.first]};
            api.tradeHistory.push(history);
        }else if (decision == 'sell') {
            if (ia.sellIncrease >= config.sellPositive){
                commission = api.balance[api.first] * api.buyPrice * (1 + config.sellPositive / 100) * 0.0015;
                api.balance[api.second] = api.balance[api.first] * api.buyPrice * (1 + config.sellPositive / 100) - commission;
            } else{
                commission = api.balance[api.first] * api.buyPrice * (1 + config.sellNegative / 100) * 0.0015;
                api.balance[api.second] = api.balance[api.first] * api.buyPrice * (1 + config.sellNegative / 100) - commission;
            }
            api.longPosition = false;
            var history = {'type' : 'sell', 'value' : api.buyPrice * (1 + config.sellPositive / 100), 'commission' : commission, 'balance' : api.balance[api.second]};
            api.tradeHistory.push(history);
            api.balance[api.first] = 0;
        }
    }
}

exports.getValues = function() {
    if (config.realMode) {
        bid = api.updatedBid;
        ask = api.updatedAsk;
        api.spread = 100 * (ask - bid) / ask;
        return {
            bid: bid,
            ask: ask
        };
    }else {
        if (api.historic.length > 0){
            if (api.index < api.historic.length){
                api.index++;
                value = api.historic[api.index];
            }
        }else{
            api.index++;
            api.csvToArray();
            value = api.historic[api.index];
        }
        bid = value * 0.9995;
        ask = value * 1.0005;
        return {
            bid: bid,
            ask: ask
        };
    }
}

exports.initialize = function(pair) {
    api.balance = {'USD' : 50, 'XRP' : 0};
    api.index = -1;
    api.buyPrice = 1;
    api.tradeHistory = [];
    api.historic = [];
    api.longPosition = false;
    api.pair = pair;
    api.first = pair.substring(0, 3);
    api.second = pair.substring(3, 6);
    ia.localHistory = [];
    ia.bid = -1;
    ia.ask = -1;
    api.spread = 0.1;
    ia.localMin = Infinity;
    ia.sellIncrease = 0;
    ia.buyIncrease = 0;
}

exports.csvToArray = function() {
    var stuff = fs.readFileSync('./' + api.pair + '.csv', 'utf8');
    api.historic = stuff.split(',');
}

exports.depth = function() {
    pair = api.pair;
    count = 1;
    kraken.api('Depth', {pair, count}, api.printResultsDepth);
}

exports.printResultsDepth = function(error, data) {
    if (error != null) {
        console.log(error);
    }else {
        api.updatedBid = eval(api.searcher).bids[0][0];
        api.updatedAsk = eval(api.searcher).asks[0][0];
        console.log('Bid: ' + api.updatedBid + ' Ask: ' + api.updatedAsk);
    }
}