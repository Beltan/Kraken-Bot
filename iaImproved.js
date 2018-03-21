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

function getPosition(userref) {
    for (i = 0; i < ia.pendingPositions.length; i++) {
        if (ia.tradeHistory[ia.pendingPositions[i]]['txid'] == userref) {
            var position = ia.tradeHistory[ia.pendingPositions[i]]['position'];
        }else {
            var position = -1;
        }
    }
    return position;
}

function updateTradeHistory(closedOrders) {
    for(var key in closedOrders) {
        var position = getPosition(closedOrders[key]['userref']);
        if (closedOrders[key]['descr']['type'] == 'buy') {
            if (position != -1) {
                var average = ia.tradeHistory[position]['buyPrice'] * ia.tradeHistory[position]['quantity'] + closedOrders[key]['price'] * closedOrders[key]['vol_exec'] / (ia.tradeHistory[position]['quantity'] + closedOrders[key]['vol_exec']);
                ia.tradeHistory[position]['buyPrice'] = average;
                ia.tradeHistory[position]['quantity'] += closedOrders[key]['vol_exec'];
                ia.tradeHistory[position]['buyComission'] += closedOrders[key]['fee'];
            }else {
                var history = {'position' : ia.tradeHistory.length, 'txid' : key, 'buyPrice' : closedOrders[key]['price'], 'quantity' : closedOrders[key]['vol_exec'], 'buyCommission' : closedOrders[key]['fee'], 'sellPrice' : 0, 'vol_exec' : 0, 'sellCommission' : 0};
                ia.tradeHistory.push(history);
                ia.pendingPositions[tradeHistory.length] = tradeHistory.length - 1;
            }
        } else {
            var average = ia.tradeHistory[position]['sellPrice'] * ia.tradeHistory[position]['vol_exec'] + closedOrders[key]['price'] * closedOrders[key]['vol_exec'] / (ia.tradeHistory[position]['vol_exec'] + closedOrders[key]['vol_exec']);
            ia.tradeHistory[position]['sellPrice'] = average;
            ia.tradeHistory[position]['vol_exec'] += closedOrders[key]['vol_exec'];
            ia.tradeHistory[position]['sellComission'] += closedOrders[key]['fee'];
            if (ia.tradeHistory[position]['quantity'] == ia.tradeHistory[position]['vol_exec']) {
                ia.pendingPositions.splice(position, 1);
            }
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
    var buyConditions = buyConditions (bid);
    var keys = Object.keys(openOrders)
    var buyPrice = bid + ia.spread;
    var decision = {'type' : 'standby', 'keys' : keys};

    if (!buyConditions && o.openBuys.length == 1) {
        decision = {'type' : constants.cancel, 'txid' : o.openBuys[0], 'keys' : keys};
    }else if (buyConditions && (keys.length == 0 || (o.openBuys.length == 0 && keys.length < config.maxBuy))) {
        var buyBalance = balance / (config.maxBuy - keys.length);
        decision = {'type' : constants.placeBuy, 'price' : buyPrice, 'quantity' : buyBalance, 'keys' : keys};
    }else if (buyConditions && o.openBuys.length == 1 && bid > openOrders[o.openBuys[0]]['descr']['price']) {
        var position = getPosition(openOrders[o.openBuys[0]]['userref']);
        var pendingBuy = ia.tradeHistory['position']['quantity'] - ia.tradeHistory['position']['vol_exec'];
        if (pendingBuy > (ia.krakenMin * buyPrice)) {
            decision = {'type' : constants.updateBuy, 'txid' : o.openBuys[0], 'price' : buyPrice, 'quantity' : pendingBuy, 'keys' : keys};
        }
// check from here
    }else if (o.openBuys.length == 0 && ia.openTrades.length > 0) {
        for (i = 0; i < ia.openTrades.length; i++) {
            if (ia.openTrades[i]['sold'] == 'no') {
                decision = {'type' : constants.placeSell, 'userref' : openTrades[i]['txid'], 'price' : ia.openTrades[i]['buyPrice'] * (1 + config.sellPositive / 100), 'quantity' : ia.openTrades[i]['quantity'], 'keys' : keys};
                ia.openTrades[i]['sold'] = 'yes';
                return decision;
            }
            if (ia.openTrades[i][buyPrice] * (1 + config.sellNegative / 100) < bid) {
                decision = {'type' : constants.updateSell, 'userref' : openTrades[i]['txid'], 'price' : 'market', 'quantity' : openTrades[i]['quantity'], 'keys' : keys};
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
    ia.pendingPositions = [];
    ia.lastDeleted = 0;
    ia.localMin = Infinity;
    ia.krakenMin = eval('config.krakenMin' + pair.substring(0, 3));
    ia.spread = eval('config.spread' + pair.substring(0, 3));
}