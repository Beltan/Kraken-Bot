const config = require('./../config').api;

const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

exports.continue = function() {
    return true;
}

// Kraken calls, pending review

function getOpenOrders() {
    kraken.api('OpenOrders', {}, results);
}

function cancelOrder() {
    var txid = '';
    kraken.api('CancelOrder', {txid}, results);
}

function queryOrder() {
    var txid = '';
    kraken.api('QueryOrders', {txid}, results);
}

function placeOrder() {
    var pair = 'XRPUSD';
    var type = 'buy';
    var ordertype = 'limit';
    var price = 0.01;
    var volume = 30;
    kraken.api('AddOrder', {pair, type, ordertype, price, volume}, results);
}

function results (error, data) {
    if(error != null){
        console.log(error);
    }else {
        console.log (data);
    }
}
