config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

exports.execute = function(decision) {
    if (config.realMode) {
        if (decision == 'standby') {}
        else if (decision == 'buy') {
            api.placeBuyOrder();
            api.check();
        }else if (decision == 'sell') {
            api.checkSell();
        }
    }else {
        if (decision == 'standby') {}
        else if (decision == 'buy') {
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
    api.completePair = 'X' + api.first + 'Z' + api.second;
    api.searcher = 'data.result.' + api.completePair;
    api.status = 'closed';
    api.txid = '';
    api.decision = 'standby';
    ia.localHistory = [];
    ia.bid = -1;
    ia.ask = -1;
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

exports.placeBuyOrder = function() {
    pair = api.completePair;
    type = 'buy';
    ordertype = 'limit';
    price = api.updatedBid + 0.00001;
    volume = api.balance[api.first] / price;
    kraken.api('AddOrder', {pair, type, ordertype, price, volume}, api.resultsOrder);
}

exports.placeSellOrder = function() {
    pair = api.completePair;
    type = 'sell';
    ordertype = 'stop-loss-profit';
    price = api.buyPrice * (1 + config.sellNegative / 100);
    price2 = api.buyPrice * (1 + config.sellPositive / 100);
    volume = api.balance[api.second];
    kraken.api('AddOrder', {pair, type, ordertype, price, price2, volume}, api.resultsOrder);
}

exports.checkSell = function() {
    kraken.api('QueryOrders', {txid = api.txid}, api.resultsCheckSell);
}

exports.resultsCheckSell = function(error, data) {
    if (error != null) {
        console.log(error);
    }else {
        if (data.result[api.txid]['status'] == 'closed') {
            api.longPosition = false;
            console.log('Sold at ' + data.result[api.txid]['price']);
        } else {
            console.log('Something is wrong'); // Some way to terminate the program should be implemented for safety.
        }
    }
}

exports.resultsOrder = function(error, data) {
    if (error != null) {
        console.log(error);
    }else {
        api.txid = data.result.txid;
        api.checkPending();
        while (api.status == 'pending') {
            api.checkPending();
        }
        console.log('Order placed: ' + data.result.descr.order);
    }
}

exports.resultsQuery = function(error, data) {
    if (error != null) {
        console.log(error);
    }else {
        api.status = data.result[api.txid]['status'];
        if (api.status = 'closed'){
            console.log('Bought at ' + data.result[api.txid]['price']);
            api.longPosition = true;
            api.placeSellOrder();
        }else if (api.status == 'open') {
            if (data.result[api.txid]['vol_exec'] == 0) {
                if (api.decision == 'buy') {
                    if (api.updatedBid != data.results[api.txid]['price']) {
                        api.cancelOrder();
                        api.placeBuyOrder();
                    }
                }else {
                    api.cancelOrder();
                }
            }else {
                if (api.decision == 'buy') {
                }else {
                    api.cancelOrder();
                    api.longPosition = true;
                    api.placeSellOrder();
                }
            }
        }
    }
}

exports.cancelOrder = function() {
    kraken.api('CancelOrder', txid = api.txid, api.resultCancelOrder);
}

exports.resultCancelOrder = function(error, data) {
    if (error != null) {
        console.log(error);
    }else {
        api.checkPending();
        while (api.status == 'pending') {
            api.checkPending();
        }
    }
}

exports.checkPending = function() {
    kraken.api('QueryOrders', txid = api.txid, api.resultsPending);
}

exports.resultsPending = function(error, data) {
    if (error != null) {
        console.log(error);
    }else {
        api.status = data.results[api.txid]['status'];
    }
}

exports.check = function() {
    kraken.api('QueryOrders', {txid = api.txid}, api.resultsQuery);
}