config = require('./config').api;
getHistoric = require('./getHistoric');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

exports.initialize = function(pair) {
    getHistoric.pair = pair;
    getHistoric.first = pair.substring(0, 3);
    getHistoric.second = pair.substring(3, 6);
    getHistoric.completePair = 'X' + getHistoric.first + 'Z' + getHistoric.second;
    getHistoric.searcher = 'data.result.' + getHistoric.completePair;
    getHistoric.last = 10000;
}

exports.getHistoric = function() {
    if (fs.existsSync('./historics/LastID' + getHistoric.pair + '.txt')){
        getHistoric.last = fs.readFileSync('./historics/LastID' + getHistoric.pair + '.txt', 'utf8');
    }
    functions.historic();
}
    
exports.historic = function() {
    var pair = getHistoric.pair;
    var since = getHistoric.last;
    kraken.api('Trades', {pair, since}, functions.printResultsHistoric);
}

exports.printResultsHistoric = function(error, data) {
    if(error != null){
        console.log(error);
    }
    else {
        getHistoric.last = data.result.last;
        var tempData = [];
        tempData = eval(getHistoric.searcher);
        for (m = 0; m < tempData.length; m++){
            tempData[m] = tempData[m][0];
        }
        tempData.unshift('');
        var pairName = './historics/' + getHistoric.pair + '.csv';
        var lastID = './historics/LastID' + getHistoric.pair + '.txt';
        functions.write(pairName, tempData);
        functions.overwrite(lastID, getHistoric.last);
        console.log('File Updated to ' + getHistoric.last);
    }
}

exports.overwrite = function(fileName, data) {
    fs.writeFileSync(fileName, data, 'binary');
}

exports.write = function(fileName, data) {
    fs.appendFileSync(fileName, data, 'binary');
}