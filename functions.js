config = require('./config');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

exports.initialize = function(pair) {
    store.pair = pair;
    store.first = pair.substring(0, 3);
    store.second = pair.substring(3, 6);
    store.completePair = 'X' + store.first + 'Z' + store.second;
    store.searcher = 'data.result.' + store.completePair;
}

exports.nextParameter = function(index) {
    if (store.array.length > 0){
        store.parameter = store.array[index];
    }else{
        functions.csvToArray();
        store.parameter = store.array[index];
    }
}

exports.csvToArray = function() {
    var stuff = fs.readFileSync('./' + store.pair + '.csv', 'utf8');
    store.array = stuff.split(',');
}

exports.getHistoric = async function() {
    if (fs.existsSync('./LastID' + store.pair + '.txt')){
        store.last = fs.readFileSync('./LastID' + store.pair + '.txt', 'utf8');
    }
    await functions.historic();
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
        var tempData = [];
        tempData = eval(store.searcher);
        for (m = 0; m < tempData.length; m++){
            tempData[m] = tempData[m][0];
        }
        tempData.unshift('');
        var pairName = store.pair + '.csv';
        var lastID = 'LastID' + store.pair + '.txt';
        functions.write(pairName, tempData);
        functions.overwrite(lastID, store.last);
        console.log('File Updated to ' + store.last);
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
    console.log('Your current balance is ' + store.testBalance[store.first] + ' ' + store.first + ' and ' + store.testBalance[store.second] + ' ' + store.second);
}

exports.buy = function() {
    if (store.spread < 0.25)
        functions.placeBuyOrder();
    else 
        console.log('Failed to buy, spread is too large');
}

exports.placeBuyOrder = function() {
    commission = store.testBalance[store.second] * 0.0015;
    store.testBalance[store.second] = store.testBalance[store.second] - commission;
    store.testBalance[store.first] = store.testBalance[store.second] / store.ask;
    store.testBalance[store.second] = 0;
    store.longPosition = true;
    store.buyPrice = store.ask;
    var history = {'type' : 'buy', 'value' : store.buyPrice, 'commission' : commission, 'balance' : store.testBalance};
    store.tradeHistory.push(history);
}

exports.placeSellOrder = function() {
    commission = store.testBalance[store.first] * store.bid * 0.0015;
    store.testBalance[store.second] = store.testBalance[store.first] * store.bid - commission;
    store.longPosition = false;
    var history = {'type' : 'sell', 'value' : store.bid, 'commission' : commission, 'balance' : store.testBalance};
    store.tradeHistory.push(history);
    store.testBalance[store.first] = 0;
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
        store.spread = 100 * (eval(store.searcher).asks[0][0] - eval(store.searcher).bids[0][0]) / eval(store.searcher).asks[0][0];
        store.bid = eval(store.searcher).bids[0][0];
        store.ask = eval(store.searcher).asks[0][0];
        console.log('Bid: ' + store.bid + ' Ask: ' + store.ask + ' spread: ' + store.spread);
}

exports.printResultsTrades = function(error, data) {
    if(error != null)
        console.log(error);
    else {
        var matrix = eval(store.searcher);
        store.min = Infinity;
        for (i=0; i<matrix.length; i++) {
            if(matrix[i][0] < store.min)
                store.min = matrix[i][0];
        }
    }
}