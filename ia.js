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
    var openBuy = '';
    for (var key in openOrders) {
        if (openOrders[key]['descr']['type'] == 'buy') {
            openBuy = key;
            return openBuy;
        }
    }
    return openBuy;
}

function getPosition(userref) {
    for (i = 0; i < ia.pendingPositions.length; i++) {
        if (ia.tradeHistory[ia.pendingPositions[i]]['txid'] == userref) {
            var position = ia.pendingPositions[i];
        }else {
            var position = -1;
        }
    }
    if (ia.pendingPositions.length == 0) {
        var position = -1;
    }
    return position;
}

function updateTradeHistory(orders) {
    for (var key in orders.openOrders) {
        if (orders.openOrders[key]['descr']['type'] == 'sell') {
            var position = getPosition(orders.closedOrders[key]['userref']);
            ia.tradeHistory[position]['placed'] == 'yes';
        }
    }
    for(var key in orders.closedOrders) {
        var position = getPosition(orders.closedOrders[key]['userref']);
        if (orders.closedOrders[key]['descr']['type'] == 'buy') {
            if (position != -1) {
                var average = ia.tradeHistory[position]['buyPrice'] * ia.tradeHistory[position]['buy_exec'] + orders.closedOrders[key]['price'] * orders.closedOrders[key]['vol_exec'] / (ia.tradeHistory[position]['buy_exec'] + orders.closedOrders[key]['vol_exec']);
                ia.tradeHistory[position]['buyPrice'] = average;
                ia.tradeHistory[position]['buy_exec'] += orders.closedOrders[key]['vol_exec'];
                ia.tradeHistory[position]['buyComission'] += orders.closedOrders[key]['fee'];
                ia.tradeHistory[position]['fiat_exec'] = ia.tradeHistory[position]['buy_exec'] * ia.tradeHistory[position]['buyPrice'];
            }else {
                var history = {'txid' : key, 'buyPrice' : orders.closedOrders[key]['price'], 'fiat_total' : orders.closedOrders[key]['vol'] * orders.closedOrders[key]['price'], 'fiat_exec' : orders.closedOrders[key]['vol_exec'] * orders.closedOrders[key]['price'], 'buy_exec' : orders.closedOrders[key]['vol_exec'], 'volume' : orders.closedOrders[key]['vol'], 'buyCommission' : orders.closedOrders[key]['fee'], 'sellPrice' : 0, 'vol_exec' : 0, 'sellCommission' : 0, 'placed' : 'no'};
                ia.tradeHistory.push(history);
                ia.pendingPositions[tradeHistory.length] = tradeHistory.length - 1;
            }
        } else {
            var average = ia.tradeHistory[position]['sellPrice'] * ia.tradeHistory[position]['sell_exec'] + orders.closedOrders[key]['price'] * orders.closedOrders[key]['vol_exec'] / (ia.tradeHistory[position]['sell_exec'] + orders.closedOrders[key]['vol_exec']);
            ia.tradeHistory[position]['sellPrice'] = average;
            ia.tradeHistory[position]['sell_exec'] += orders.closedOrders[key]['vol_exec'];
            ia.tradeHistory[position]['sellComission'] += orders.closedOrders[key]['fee'];
            if (ia.tradeHistory[position]['buy_exec'] == ia.tradeHistory[position]['sell_exec']) {
                ia.pendingPositions.splice(position, 1);
            }
        }
    }
}

function buyConditions(bid) {
    var buyCons = false;
    var buyIncrease = 100 * (bid - ia.localMin) / ia.localMin;
    if ((buyIncrease >= config.lowBuy) && (buyIncrease <= config.highBuy)) {
        buyCons = true;
    }
    return buyCons;
}

function updateDecision(bid, balance, openBuy, openOrders) {
    var buyCons = buyConditions(bid);
    var keys = [];
    if (openOrders != undefined) {
        keys = Object.keys(openOrders)
    }
    var buyPrice = bid + ia.spread;
    var decision = {'type' : 'standby', 'keys' : keys};

    if (!buyCons && openBuy != '') {
        decision.type = constants.cancel;
        decision.txid = openBuy;
    }else if (buyCons && openBuy == '' && keys.length < config.maxBuy) {
        var buyBalance = balance / (config.maxBuy - keys.length);
        decision.type = constants.placeBuy;
        decision.price = buyPrice;
        decision.quantity = buyBalance / buyPrice;
    }else if (buyCons && openBuy != '' && bid > openOrders[openBuy]['descr']['price']) {
        if (openOrders[openBuy]['userref'] != '') {
            var position = getPosition(openOrders[openBuy]['userref']);
        } else {
            var position = getPosition(openBuy);
        }
        if (position != -1) {
            var pendingBuy = ia.tradeHistory[position]['fiat_total'] - ia.tradeHistory[position]['fiat_exec'];
        } else {
            var pendingBuy = openOrders[openBuy]['vol'];
        }
        if (pendingBuy > (ia.krakenMin * buyPrice)) {
            decision.type = constants.updateBuy;
            decision.txid = openBuy;
            decision.userref = ia.tradeHistory[position]['txid'];
            decision.price = buyPrice;
            decision.quantity = pendingBuy / buyPrice;
        }
    }else {
        for (i = 0; i < ia.pendingPositions.length; i++) {
            if (ia.tradeHistory[ia.pendingPositions[i]]['placed'] == 'no') {
                decision.type = constants.placeSell;
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['txid'];
                decision.price = ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellPositive / 100);
                decision.quantity = ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'];
                return decision;
            } else if (ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellNegative / 100) > bid) {
                decision.type = constants.updateSell;
                decision.price = 'market';
                decision.txid = ia.tradeHistory[ia.pendingPositions[i]]['txid'];
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['txid'];
                decision.quantity = ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'] - ia.tradeHistory[ia.pendingPositions[i]]['sell_exec'];
                return decision;
            }
        }
    }
    return decision;
}

// input -> {bid, ask, value, balance, orders}
// output -> {type, userref, txid, price, quantity, keys};
exports.decide = function(input) {
    updateHistory(input.value);
    updateLocalMinimum(input.value);
    var orders = filterOrders(input.orders);
    var openBuy = getParameters(orders.openOrders);
    updateTradeHistory(orders);
    var decision = updateDecision(input.bid, input.balance, openBuy, orders.openOrders);
    return decision;
}

exports.initialize = function(pair) {
    ia.tradeHistory = [];
    ia.localHistory = [];
    ia.pendingPositions = [];
    ia.lastDeleted = 0;
    ia.localMin = Infinity;
    ia.krakenMin = config["krakenMin" + pair.substring(0, 3)];
    ia.spread = config["spread" + pair.substring(0, 3)];
}