config = require('./config').ia;
const fs = require('fs');
var constants = require('./constants');

var ia = {};

function truncate(number) {
    multiplier = 1 / ia.spread;
    numberTrunc = Math.trunc(number * multiplier) / multiplier;
    return numberTrunc;
}

function truncTo8(number) {
    multiplier = 100000000;
    numberTrunc = Math.trunc(number * multiplier) / multiplier;
    return numberTrunc;
}

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
    var closedOrders = Object.assign({}, openOrders);
    for (var key in openOrders) {
        if (openOrders[key]['status'] == constants.closed || openOrders[key]['status'] == constants.canceled) {
            if (openOrders[key]['vol_exec'] == 0) {
                delete closedOrders[key];
            }
            delete openOrders[key];
        } else {
            delete closedOrders[key];
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

function deleteIndex(position) {
    for (i = 0; i < ia.pendingPositions.length; i++) {
        if (ia.pendingPositions[i] = position) {
            ia.pendingPositions.splice(i, 1);
        }
    }
}

function getPosition(userref) {
    for (i = 0; i < ia.pendingPositions.length; i++) {
        if (ia.tradeHistory[ia.pendingPositions[i]]['userref'] == userref) {
            var position = ia.pendingPositions[i];
            return position;
        }else {
            var position = -1;
            return position;
        }
    }
    if (ia.pendingPositions.length == 0) {
        var position = -1;
        return position;
    }
}

function updateTradeHistory(orders) {
    for (var key in orders.openOrders) {
        if (orders.openOrders[key]['descr']['type'] == 'sell') {
            var position = getPosition(orders.closedOrders[key]['userref']);
            ia.tradeHistory[position]['placed'] = 'yes';
        }
    }
    for(var key in orders.closedOrders) {
        var position = getPosition(orders.closedOrders[key]['userref']);
        if (orders.closedOrders[key]['descr']['type'] == 'buy') {
            if (position != -1) {
                var average = ia.tradeHistory[position]['buyPrice'] * ia.tradeHistory[position]['buy_exec'] + Number(orders.closedOrders[key]['price']) * Number(orders.closedOrders[key]['vol_exec']) / (ia.tradeHistory[position]['buy_exec'] + Number(orders.closedOrders[key]['vol_exec']));
                ia.tradeHistory[position]['buyPrice'] = average;
                ia.tradeHistory[position]['buy_exec'] += Number(orders.closedOrders[key]['vol_exec']);
                ia.tradeHistory[position]['buyComission'] += Number(orders.closedOrders[key]['fee']);
            }else {
                var history = {'txid' : key, 'userref' : orders.closedOrders[key]['userref'], 'buyPrice' : Number(orders.closedOrders[key]['price']), 'buy_exec' : Number(orders.closedOrders[key]['vol_exec']), 'volume' : Number(orders.closedOrders[key]['vol']), 'buyCommission' : Number(orders.closedOrders[key]['fee']), 'sellPrice' : 0, 'vol_exec' : 0, 'sellCommission' : 0, 'placed' : 'no'};
                ia.tradeHistory.push(history);
                ia.pendingPositions.push(ia.tradeHistory.length - 1);
            }
        } else {
            var average = ia.tradeHistory[position]['sellPrice'] * ia.tradeHistory[position]['sell_exec'] + Number(orders.closedOrders[key]['price']) * Number(orders.closedOrders[key]['vol_exec']) / (ia.tradeHistory[position]['sell_exec'] + Number(orders.closedOrders[key]['vol_exec']));
            ia.tradeHistory[position]['sellPrice'] = average;
            ia.tradeHistory[position]['sell_exec'] += Number(orders.closedOrders[key]['vol_exec']);
            ia.tradeHistory[position]['sellComission'] += Number(orders.closedOrders[key]['fee']);
            if (truncTo8(ia.tradeHistory[position]['buy_exec']) == truncTo8(ia.tradeHistory[position]['sell_exec'])) {
                deleteIndex(position);
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

function newUserref() {
    var userref = Object.keys(ia.userref);
    if (userref.length != 0) {
        for (i = 1; i <= config.maxBuy; i++) {
            if (userref[i - 1] != i) {
                return i;
            }
        }
    } else {
        return 1;
    }
}

function updateDecision(bid, balance, openBuy, openOrders) {
    var buyCons = buyConditions(bid);
    var keys = [];
    if (openOrders != undefined) {
        keys = Object.keys(openOrders)
    }
    var buyPrice = truncate(bid + ia.spread);
    var decision = {'type' : 'standby', 'keys' : keys};

    if (!buyCons && openBuy != '') {
        decision.type = constants.cancel;
        decision.txid = openBuy;
    }else if (buyCons && openBuy == '' && ia.pendingPositions.length < config.maxBuy) {
        var buyBalance = 0.99 * balance / (config.maxBuy - ia.pendingPositions.length);
        decision.order = 'buy';
        decision.type = constants.placeBuy;
        decision.ordertype = 'limit';
        decision.price = buyPrice;
        decision.quantity = buyBalance / buyPrice;
        decision.userref = newUserref();
    }else if (buyCons && openBuy != '' && bid > openOrders[openBuy]['descr']['price']) {
        var position = getPosition(openOrders[openBuy]['userref']);
        if (position != -1) {
            var pendingBuy = ia.tradeHistory[position]['volume'] - ia.tradeHistory[position]['buy_exec'];
        } else {
            var pendingBuy = openOrders[openBuy]['descr']['price'] * (openOrders[openBuy]['vol'] - openOrders[openBuy]['vol_exec']) / buyPrice;
        }
        if (pendingBuy > ia.krakenMin) {
            decision.order = 'buy';
            decision.type = constants.updateBuy;
            decision.ordertype = 'limit';
            decision.price = buyPrice;
            decision.quantity = pendingBuy;
            decision.userref = openOrders[openBuy]['userref'];
            decision.txid = openBuy;
        }
    }else {
        for (i = 0; i < ia.pendingPositions.length; i++) {
            if (ia.tradeHistory[ia.pendingPositions[i]]['placed'] == 'no') {
                decision.type = constants.placeSell;
                decision.order = 'sell';
                decision.ordertype = 'limit';
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['userref'];
                decision.price = truncate(ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellPositive / 100));
                decision.quantity = ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'];
                return decision;
            } else if (ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellNegative / 100) > bid) {
                decision.type = constants.updateSell;
                decision.order = 'sell';
                decision.price = undefined;
                decision.ordertype = 'market';
                decision.txid = ia.tradeHistory[ia.pendingPositions[i]]['userref'];
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['userref'];
                decision.quantity = ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'] - ia.tradeHistory[ia.pendingPositions[i]]['sell_exec'];
                return decision;
            }
        }
    }
    return decision;
}

// input -> {bid, ask, value, balance, orders}
// output -> {order, ordertype, type, userref, txid, price, quantity, keys};
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
    ia.userref = {};
    ia.lastDeleted = 0;
    ia.localMin = Infinity;
    ia.krakenMin = config["krakenMin" + pair.substring(0, 3)];
    ia.spread = config["spread" + pair.substring(0, 3)];
}