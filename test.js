var fs = require('fs');
var contents = fs.readFileSync('C:\\Users\\emrbe\\OneDrive\\Documents\\GitHub\\key.js'.toString(), 'utf8').split('\n');
const key       = contents[0]; // API Key
const secret    = contents[1]; // API Private Key
const KrakenClient = require('kraken-api');
const kraken       = new KrakenClient(key, secret);

var store = {
    testBalance: 50,
    longPosition: false,
    position: 0,
    spread: 1,
    bid: -1,
    ask: -1,
    buyPrice: 1,
    min: Infinity,
    pair: 'XRPUSD'
};

function historic() {
    pair = store.pair;
    kraken.api('Trades', {pair}, printResultsTrades);
}

function trade() {

    var sellIncrease = 100*(store.bid - store.buyPrice)/store.buyPrice;
    var buyIncrease = 100*(store.ask - store.min)/store.min;

    if (!store.longPosition && buyIncrease >= 1)
        buy();
    else if (store.longPosition && sellIncrease >= 5)
        sell();
        
    console.log('Your current balance is ' + store.testBalance);
    console.log('Your current position is ' + store.position);
}

function buy() {
    if (store.spread < 0.2)
        placeBuyOrder();
    else 
        console.log('Failed to buy, spread is too large');
}

function placeBuyOrder() {
    store.position = store.testBalance/store.ask;
    store.testBalance = 0;
    store.longPosition = true;
    store.buyPrice=store.ask;
}

function placeSellOrder() {
    store.testBalance = store.position*store.bid;
    store.position = 0;
    store.longPosition = false;
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
        store.spread = 100*(data.result.XXRPZUSD.asks[0][0] - data.result.XXRPZUSD.bids[0][0])/data.result.XXRPZUSD.asks[0][0];
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