config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

exports.getHistoric = async function() {
    store.last = fs.readFileSync('./LastID.csv');
    for (k = 0; k < 5; k++){
        await functions.historic();
    }
    await functions.unify();
    var pairName = store.pair + '.csv';
    var lastID = 'LastID.csv';
    store.data.unshift('');
    await functions.write(pairName, store.data);
    await functions.overwrite(lastID, store.last);
}
    
exports.historic = async function() {
    pair = store.pair;
    since = store.last;
    await kraken.api('Trades', {pair, since}, functions.printResultsHistoric);
}
    
exports.printResultsHistoric = function(error, data) {
    if(error != null){
        console.log(error);
    }
    else {
        store.last = data.result.last;
        store.matrix[store.historicCounter] = data.result.XXRPZUSD;
        store.historicCounter++;
        console.log(store.historicCounter);
    }
}
    
exports.unify = function() {
    for (i = store.data.length; i < store.matrix.length; i++){
        for (j = 0; j < 1000; j++){
            store.data[i * 1000 + j] = store.matrix[i][j][0];
        }
    }
}

exports.overwrite = function(fileName, data) {
    fs.writeFileSync(fileName, data, 'binary');
}

exports.write = function(fileName, data) {
    fs.appendFileSync(fileName, data, 'binary');
}

exports.historicInit = function() {
    pair = store.pair;
    kraken.api('Trades', {pair}, functions.printResultsTrades);
}

exports.trade = function() {
    var sellIncrease = 100 * (store.bid - store.buyPrice) / store.buyPrice;
    var buyIncrease = 100 * (store.ask - store.min) / store.min;
    if (!store.longPosition && buyIncrease >= 1)
        functions.buy();
    else if (store.longPosition && sellIncrease >= 5)
        functions.sell();
    console.log('Your current balance is ' + store.testBalance['USD'] + ' USD and ' + store.testBalance[`XRP`] + ' XRP');
}

exports.buy = function() {
    if (store.spread < 0.2)
        functions.placeBuyOrder();
    else 
        console.log('Failed to buy, spread is too large');
}

exports.placeBuyOrder = function() {
    commission = store.testBalance['USD'] * 0.0015;
    store.testBalance['USD'] = store.testBalance['USD'] - commission;
    store.testBalance['XRP'] = store.testBalance['USD'] / store.ask;
    store.testBalance['USD'] = 0;
    store.longPosition = true;
    store.buyPrice = store.ask;
    var history = {'type' : 'buy', 'value' : store.buyPrice, 'commission' : commission, 'balance' : store.testBalance};
    store.tradeHistory.push(history);
}

exports.placeSellOrder = function() {
    commission = store.testBalance['XRP'] * store.bid * 0.0015;
    store.testBalance['USD'] = store.testBalance['XRP'] * store.bid - commission;
    store.longPosition = false;
    var history = {'type' : 'sell', 'value' : store.bid, 'commission' : commission, 'balance' : store.testBalance};
    store.tradeHistory.push(history);
    store.testBalance['XRP'] = 0;
}

exports.sell = function() {
    if (store.spread < 0.5)
        functions.placeSellOrder();
    else 
        console.log('Failed to sell, spread is too large');
}

exports.depth = function() {
    pair = store.pair;
    count = 1;
    kraken.api('Depth', {pair, count}, functions.printResultsDepth);
}

exports.printResultsDepth = function(error, data) {
    if(error != null)
        console.log(error);
    else
        store.spread = 100 * (data.result.XXRPZUSD.asks[0][0] - data.result.XXRPZUSD.bids[0][0]) / data.result.XXRPZUSD.asks[0][0];
        store.bid = data.result.XXRPZUSD.bids[0][0];
        store.ask = data.result.XXRPZUSD.asks[0][0];
        console.log('Bid: ' + store.bid + ' Ask: ' + store.ask + ' spread: ' + store.spread);
}

exports.printResultsTrades = function(error, data) {
    if(error != null)
        console.log(error);
    else {
        var matrix = data.result.XXRPZUSD;
        store.min = Infinity;
        for (i=0; i<matrix.length; i++) {
            if(matrix[i][0] < store.min)
                store.min = matrix[i][0];
        }
    }
}