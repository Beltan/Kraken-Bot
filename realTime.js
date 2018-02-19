config = require('./config');
store = require('./store');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

function historic() {
    pair = store.pair;
    kraken.api('Trades', {pair}, printResultsTrades);
}

function trade() {
    var sellIncrease = 100 * (store.bid - store.buyPrice) / store.buyPrice;
    var buyIncrease = 100 * (store.ask - store.min) / store.min;
    if (!store.longPosition && buyIncrease >= 1)
        buy();
    else if (store.longPosition && sellIncrease >= 5)
        sell();
    console.log('Your current balance is ' + store.testBalance['USD'] + ' USD and ' + store.testBalance[`XRP`] + ' XRP');
}

function buy() {
    if (store.spread < 0.2)
        placeBuyOrder();
    else 
        console.log('Failed to buy, spread is too large');
}

function placeBuyOrder() {
    commission = store.testBalance['USD'] * 0.0015;
    store.testBalance['USD'] = store.testBalance['USD'] - commission;
    store.testBalance['XRP'] = store.testBalance['USD'] / store.ask;
    store.testBalance['USD'] = 0;
    store.longPosition = true;
    store.buyPrice = store.ask;
    var history = {'type' : 'buy', 'value' : store.buyPrice, 'commission' : commission, 'balance' : store.testBalance};
    store.tradeHistory.push(history);
}

function placeSellOrder() {
    commission = store.testBalance['XRP'] * store.bid * 0.0015;
    store.testBalance['USD'] = store.testBalance['XRP'] * store.bid - commission;
    store.longPosition = false;
    var history = {'type' : 'sell', 'value' : store.bid, 'commission' : commission, 'balance' : store.testBalance};
    store.tradeHistory.push(history);
    store.testBalance['XRP'] = 0;
}

function sell() {
    if (store.spread < 0.5)
        placeSellOrder();
    else 
        console.log('Failed to sell, spread is too large');
}

function depth() {
    pair = store.pair;
    count = 1;
    kraken.api('Depth', {pair, count}, printResultsDepth);
}

function printResultsDepth(error, data) {
    if(error != null)
        console.log(error);
    else
        store.spread = 100 * (data.result.XXRPZUSD.asks[0][0] - data.result.XXRPZUSD.bids[0][0]) / data.result.XXRPZUSD.asks[0][0];
        store.bid = data.result.XXRPZUSD.bids[0][0];
        store.ask = data.result.XXRPZUSD.asks[0][0];
        console.log('Bid: ' + store.bid + ' Ask: ' + store.ask + ' spread: ' + store.spread);
}

function printResultsTrades(error, data) {
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

setInterval (trade, 10000);
setInterval (depth, 10000);
setInterval (historic, 10000);