config = require('./config').ia;
const fs = require('fs');
var constants = require('./constants');

var ia = {};

function updateHistory(value) {
    if (ia.localHistory.length < config.local){
        ia.localHistory.push(value);
    }else{
        ia.lastDeleted = ia.localHistory.shift();
        ia.localHistory.push(value);
    }
}

function updateLocalMinimum(value) {
    if (ia.lastDeleted == ia.localMin) {
        ia.localMin = Infinity;
        for (j = 0; j < ia.localHistory.length; j++) {
            if (ia.localMin > ia.localHistory[j]){
                ia.localMin = ia.localHistory[j];
            }
        }
    }else {
        if (ia.localMin > value) {
            ia.localMin = value;
        }
    }
}

function filterOrders(openOrders) {
    var closedOrders = {};
    for (var key in openOrders) {
        if (openOrders[key]['status'] == constants.closed || openOrders[key]['status'] == constants.canceled) {
            Object.assign(closedOrders, openOrders[key]);
            delete openOrders[key];
        }
    }
    return {openOrders, closedOrders};
}

function getParameters(openOrders) {
    var openBuys = [];
    var openSells = [];
    var keyBuy = '';
    var highestBuy = 0;
    for (var key in openOrders) {
        if (openOrders[key]['descr']['type'] == 'buy') {
            openBuys.push() = key;
        }
        if (openOrders[key]['descr']['type'] == 'sell') {
            openSells.push() = key;
            if (highestBuy < openOrders[key]['descr']['price']) {
                highestBuy = openOrders[key]['descr']['price'];
                keyBuy = key;
            }
        }
    }
    var openKeys = {openBuys, openSells, keyBuy};
    return openKeys;
}

function initOrder() {
    ia.volume = 0;
    ia.average = 0;
    ia.fee = 0;
}

function updatePending(openBuys, openOrders) {
    ia.average = (ia.average * ia.volume + openOrders[openBuys[0]]['price'] * openOrders[openBuys[0]]['vol']) / (ia.volume + openOrders[openBuys[0]]['vol']);
    ia.volume += openOrders[openBuys[0]]['vol'];
    ia.fee += openOrders[openBuys[0]]['fee'];
}

function updateClosed(closedOrders) {
    var average = ia.volume * ia.average + closedOrders[key]['vol_exec'] * closedOrders[key]['price'];
    var volume = ia.volume + closedOrders[key]['vol_exec'];
    var fee = ia.fee + closedOrders[key]['fee'];
    data = {'average' : average, 'volume' : volume, 'fee' : fee};
    return data;
}

function getPosition(key) {
    var index = ia.openTrades.findIndex(i => i.userref == key);
    var position = ia.openTrades[index]['position'];
    ia.openTrades.slice(index, 1);
    return position;
}

function updateVectors(position, history) {
    ia.openTrades.push(history);
    ia.tradeHistory.slice(position, 1);
    ia.tradeHistory.push(history);
}

// Pending review of updateTradeHistory
function updateTradeHistory(closedOrders) {
    for (var key in closedOrders) {
        if (closedOrders[key]['status'] == constants.closed || closedOrders[key]['vol_exec'] != 0) {
            if ((closedOrders[key]['status'] == constants.cancelled) || (closedOrders[key]['status'] == constants.closed && closedOrders[key]['descr']['type'] == 'buy')) {
                var history = {'position' : ia.tradeHistory.length, 'txid' : key, 'buyPrice' : closedOrders[key]['price'], 'quantity' : closedOrders[key]['vol_exec'], 'buyCommission' : closedOrders[key]['fee'], 'sold' : 'no'};
                for (i = 0; i < ia.openTrades.length; i++) {
                    if (ia.opentrades[i]['txid'] == key) {
                        var data = updateClosed(closedOrders);
                        history = {'position' : ia.tradeHistory.length - 1, 'txid' : key, 'buyPrice' : data.average, 'quantity' : data.volume, 'buyCommission' : data.fee, 'sold' : 'no'};
                    }
                }
                var position = getPosition();
                updateVectors(position, history);
            }if (closedOrders[key]['descr']['type'] == 'sell') {
                var history = {'sellPrice' : closedOrders[key]['price'], 'sellCommission' : closedOrders[key]['fee']};
                var position = getPosition();
                Object.assign(ia.tradeHistory[position], history);
            }
        }
    }
}

function updateTradeHistory(closedOrders) {
    for(var key in closedOrders) {
        if (closedOrders[key]['descr']['type'] == 'sell') {
            var history = {'sellPrice' : closedOrders[key]['price'], 'sellCommission' : closedOrders[key]['fee']};
            var position = getPosition(key);
            Object.assign(ia.tradeHistory[position], history);
        }else {
            
        }
    }
}

function buyConditions(bid) {
    var buyConditions = false;
    var buyIncrease = 100 * (bid - ia.localMin) / ia.localMin;
    if ((buyIncrease >= config.lowBuy) && (buyIncrease <= config.highBuy)) {
        buyConditions = true;
    }
    return buyConditions;
}

//o -> openKeys
function updateDecision(bid, balance, o, openOrders) {
    var decision = {'type' : 'standby'};
    var buyConditions = buyConditions (bid);
    var length = Object.keys(openOrders).length;
    var buyPrice = bid + ia.spread;

    if (!buyConditions && o.openBuys.length == 1) {
        decision = {'type' : constants.cancel, 'txid' : o.openBuys[0]};
    }else if (buyConditions && (length == 0 || (o.openBuys.length == 0 && length < config.maxBuy))) {
        var buyBalance = balance / (config.maxBuy - length);
        initOrder();
        decision = {'type' : constants.placeBuy, 'price' : buyPrice, 'quantity' : buyBalance};
    }else if (buyConditions && o.openBuys.length == 1 && bid > openOrders[o.openBuys[0]]['descr']['price'] && pendingBuy > (ia.krakenMin * buyPrice)) {
        var pendingBuy = openOrders[o.openBuys[0]]['vol'] - openOrders[o.openBuys[0]]['vol_exec'];
        updatePending(o.openBuys, openOrders);
        decision = {'type' : constants.updateBuy, 'txid' : o.openBuys[0], 'price' : buyPrice, 'quantity' : pendingBuy};
    }else if (o.openBuys.length == 0 && ia.openTrades.length > 0) {
        for (i = 0; i < ia.openTrades.length; i++) {
            if (ia.openTrades[i]['sold'] == 'no') {
                decision = {'type' : constants.placeSell, 'userref' : openTrades[i]['txid'], 'price' : ia.openTrades[i]['buyPrice'] * (1 + config.sellPositive / 100), 'quantity' : ia.openTrades[i]['quantity']};
                ia.openTrades[i]['sold'] = 'yes';
                return decision;
            }
            if (ia.openTrades[i][buyPrice] * (1 + config.sellNegative / 100) < bid) {
                decision = {'type' : constants.updateSell, 'userref' : openTrades[i]['txid'], 'price' : 'market', 'quantity' : openTrades[i]['quantity']};
                return decision;
            }
        }
    }
    return decision;
}

// input -> {bid, ask, value, balance, openOrders}
// output -> {type, txid, price, quantity};
exports.decide = function(input) {
    updateHistory(input.value);
    updateLocalMinimum(input.value);
    var orders = filterOrders(input.openOrders);
    var openKeys = getParameters(orders.openOrders);
    updateTradeHistory(orders.closedOrders);
    var decision = updateDecision(input.bid, input.balance, openKeys, orders.openOrders);
    return decision;
}

exports.initialize = function(pair) {
    initOrder();
    ia.openTrades = [];
    ia.tradeHistory = [];
    ia.localHistory = [];
    ia.lastDeleted = 0;
    ia.localMin = Infinity;
    ia.krakenMin = eval('config.krakenMin' + pair.substring(0, 3));
    ia.spread = eval('config.spread' + pair.substring(0, 3));
}
