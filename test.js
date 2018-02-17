const key          = ''; // API Key
const secret       = ''; // API Private Key
const KrakenClient = require('kraken-api');
const kraken       = new KrakenClient(key, secret);

/*
function time() {
    var timeStart;
    var timeEnd;
    timeStart = Date.now();
    kraken.api('Time', {}, printResultsTime);
}

function printResultsTime(error, data) {
    timeEnd = Date.now();

    if(error != null)
        console.log(error);
    else
        console.log(timeEnd - timeStart);
        console.log(JSON.stringify(data.result));
}

function balance() {
    kraken.api('Balance', {}, printResults);
}

function printResults(error, data) {
    if(error != null)
        console.log(error);
    else
        console.log(JSON.stringify(data.result));
}

function ticker() {
    var pair = 'XRPUSD';
    kraken.api('Ticker', {pair}, printResultsTicker);
}

function printResultsTicker(error, data) {
    if(error != null)
        console.log(error);
    else
        history.push(data.result.XXRPZUSD.c[0]);
        for (i = 0; i<history.length; i++){
            console.log(history[i]);
        }
}
*/
function historic() {
    var pair = 'XRPUSD';
    kraken.api('Trades', {pair}, printResultsTrades);
}

function trade() {

    var sellIncrease = 100*(bid - buyPrice)/buyPrice;
    var buyIncrease = 100*(ask - min)/min;

    if (!longPosition && buyIncrease >= 1)
        buy();
    else if (longPosition && sellIncrease >= 5)
        sell();
        
    console.log('Your current balance is ' + testBalance);
    console.log('Your current position is ' + position);
}

function buy() {
    if (spread < 0.2)
        placeBuyOrder();
    else 
        console.log('Failed to buy, spread is too large');
}

function placeBuyOrder() {
    position = testBalance/ask;
    testBalance = 0;
    longPosition = true;
    buyPrice=ask;
}

function placeSellOrder() {
    testBalance = position*bid;
    position = 0;
    longPosition = false;
}

function sell() {
    if (spread < 0.5)
        placeSellOrder();
    else 
        console.log('Failed to sell, spread is too large');
}

function depth() {
    pair = 'XRPUSD';
    count = 1;
    kraken.api('Depth', {pair, count}, printResultsDepth);
}

function printResultsDepth(error, data) {
    if(error != null)
        console.log(error);
    else
        spread = 100*(data.result.XXRPZUSD.asks[0][0] - data.result.XXRPZUSD.bids[0][0])/data.result.XXRPZUSD.asks[0][0];
        bid = data.result.XXRPZUSD.bids[0][0];
        ask = data.result.XXRPZUSD.asks[0][0];
        console.log('Bid: ' + bid + ' Ask: ' + ask + ' spread: ' + spread);
}

function printResultsTrades(error, data) {
    if(error != null)
        console.log(error);
    else {
        var matrix = data.result.XXRPZUSD;
        min = Infinity;
        for (i=0; i<matrix.length; i++) {
            if(matrix[i][0] < min)
                min = matrix[i][0];
        }
    }
}

var testBalance = 50;
var longPosition = false;
var position = 0;
var spread;
var bid;
var ask = -1;
var buyPrice = -1;
var min;
var history = [];


setInterval (trade, 10000);
setInterval (depth, 10000);
setInterval (historic, 10000);
