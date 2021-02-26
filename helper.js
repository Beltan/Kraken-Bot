const config = require('./config').api;
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: config.key,
    APISECRET: config.secret
});

exports.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.getHistoric = async function (pair, interval, options = {}) {
    let params = {
        limit: 1000,
        ...options
    }
    
    try {
        let values = await binance.candlesticks(pair, interval, null, params);
        return values;
    } catch (e) {
        console.log('Error while retrieving info, trying again... -> ' + e);
    }
}