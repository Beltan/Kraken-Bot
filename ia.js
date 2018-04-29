config = require('./config').ia;
const fs = require('fs');
var constants = require('./constants');

var ia = {};

function lowestBuy() {
    var lowBuy = Infinity;
    for (i = 0; i < ia.pendingPositions.length; i++) {
        if (ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] < lowBuy) {
            lowBuy = ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'];
        }
    }
    return lowBuy;
}

function round(number) {
    multiplier = 1 / ia.spread;
    number = Math.round(number * multiplier) / multiplier;
    return number;
}

function roundTo8(number) {
    multiplier = 100000000;
    number = Math.round(number * multiplier) / multiplier;
    return number;
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
            delete openOrders[key];
        } else {
            delete closedOrders[key];
        }
    }
    for (var key in closedOrders) {
        if (closedOrders[key]['vol_exec'] == 0) {
            delete ia.userref[closedOrders[key]['userref']];
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
        if (ia.pendingPositions[i] == position) {
            ia.pendingPositions.splice(i, 1);
        }
    }
}

function getPosition(userref) {
    for (i = 0; i < ia.pendingPositions.length; i++) {
        if (ia.tradeHistory[ia.pendingPositions[i]]['userref'] == userref) {
            var position = ia.pendingPositions[i];
            return position;
        }
    }
    var position = -1;
    return position;
}

function updateTradeHistory(orders, balance, bid) {
    for (var key in orders.openOrders) {
        if (orders.openOrders[key]['descr']['type'] == 'sell') {
            var position = getPosition(orders.openOrders[key]['userref']);
            if (ia.tradeHistory[position]['placed'] == 'no') {
                ia.tradeHistory[position]['placed'] = 'yes';
            }
        }
    }
    for(var key in orders.closedOrders) {
        var position = getPosition(orders.closedOrders[key]['userref']);
        if (orders.closedOrders[key]['descr']['type'] == 'buy') {
            if (position != -1) {
                var average = round((ia.tradeHistory[position]['buyPrice'] * ia.tradeHistory[position]['buy_exec'] + Number(orders.closedOrders[key]['price']) * Number(orders.closedOrders[key]['vol_exec'])) / (ia.tradeHistory[position]['buy_exec'] + Number(orders.closedOrders[key]['vol_exec'])));
                ia.tradeHistory[position]['buyPrice'] = average;
                ia.tradeHistory[position]['buy_exec'] = round(ia.tradeHistory[position]['buy_exec'] + Number(orders.closedOrders[key]['vol_exec']));
                ia.tradeHistory[position]['buyCommission'] = round(ia.tradeHistory[position]['buy_exec'] * ia.tradeHistory[position]['buyPrice'] * config.commission);
                ia.userref[orders.closedOrders[key]['userref']] = orders.closedOrders[key]['userref'];
            }else {
                var buyCommission = round(Number(orders.closedOrders[key]['vol_exec']) * Number(orders.closedOrders[key]['price']) * config.commission);
                var history = {'txid' : key, 'userref' : orders.closedOrders[key]['userref'], 'buyPrice' : Number(orders.closedOrders[key]['price']), 'buy_exec' : Number(orders.closedOrders[key]['vol_exec']), 'volume' : Number(orders.closedOrders[key]['vol']), 'buyCommission' : buyCommission, 'sellPrice' : 0, 'vol_exec' : 0, 'sell_exec' : 0, 'sellCommission' : 0, 'placed' : 'no', 'balance' : 0, 'profit' : 0};
                ia.tradeHistory.push(history);
                ia.pendingPositions.push(ia.tradeHistory.length - 1);
                ia.userref[orders.closedOrders[key]['userref']] = orders.closedOrders[key]['userref'];
            }
        } else {
            var average = round((ia.tradeHistory[position]['sellPrice'] * ia.tradeHistory[position]['sell_exec'] + Number(orders.closedOrders[key]['price']) * Number(orders.closedOrders[key]['vol_exec'])) / (ia.tradeHistory[position]['sell_exec'] + Number(orders.closedOrders[key]['vol_exec'])));
            ia.tradeHistory[position]['sellPrice'] = average;
            ia.tradeHistory[position]['sell_exec'] = round(ia.tradeHistory[position]['sell_exec'] + Number(orders.closedOrders[key]['vol_exec']));
            ia.tradeHistory[position]['sellCommission'] = round(ia.tradeHistory[position]['sell_exec'] * ia.tradeHistory[position]['sellPrice'] * config.commission);
            if (Math.abs(roundTo8(ia.tradeHistory[position]['buy_exec']) - roundTo8(ia.tradeHistory[position]['sell_exec'])) < 0.1) {
                ia.tradeHistory[position]['balance'] = balance[0] + balance [1] * bid;
                ia.tradeHistory[position]['profit'] = ia.tradeHistory[position]['sell_exec'] * ia.tradeHistory[position]['sellPrice'] - ia.tradeHistory[position]['sellCommission'] - ia.tradeHistory[position]['buyCommission'] - ia.tradeHistory[position]['buy_exec'] * ia.tradeHistory[position]['buyPrice'];
                delete ia.userref[ia.tradeHistory[position]['userref']];
                deleteIndex(position);
            }
        }
    }
}

function testing(orders) {
    var test = Object.keys(orders.openOrders);
    if (ia.pendingPositions.length != 0 && test.length == 0 && ia.tradeHistory[ia.pendingPositions[0]]['placed'] == 'yes') {
        var a = true;
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
        for (i = 0; i < config.maxBuy; i++) {
            if (userref[i] != i) {
                ia.userref[i] = i;
                return i;
            }
        }
    } else {
        ia.userref[0] = 0;
        return 0;
    }
}

function updateDecision(bid, ask, balance, openBuy, openOrders) {
    var buyCons = buyConditions(bid);
    var keys = [];
    if (openOrders != undefined) {
        keys = Object.keys(openOrders)
    }
    var buyPrice = round(bid + ia.spread);
    var decision = {'type' : 'standby', 'keys' : keys};
    if (ia.pendingPositions.length != 0) {
        var lowBuy = lowestBuy();
    } else {
        var lowBuy = 0;
    }

    for (i = 0; i < ia.pendingPositions.length; i++) {
        if (openBuy == '' || openOrders[openBuy]['userref'] != ia.tradeHistory[ia.pendingPositions[i]]['userref']) {
            if (ia.tradeHistory[ia.pendingPositions[i]]['placed'] == 'no') {
                decision.type = constants.placeSell;
                decision.order = 'sell';
                decision.ordertype = 'limit';
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['userref'];
                decision.price = round(ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellPositive / 100));
                decision.quantity = ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'];
                return decision;
            } else if (ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellNegative / 100) > bid) {
                var sell_exec = undefined
                decision.type = constants.updateSell;
                decision.order = 'sell';
                decision.price = undefined;
                decision.ordertype = 'market';
                decision.txid = ia.tradeHistory[ia.pendingPositions[i]]['userref'];
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['userref'];
                for (var key in openOrders) {
                    if (openOrders[key]['userref'] == decision.txid) {
                        sell_exec = Number(openOrders[key]['vol_exec']);
                        decision.quantity = roundTo8(ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'] - sell_exec);
                    }
                }
                if (sell_exec == undefined) {
                    decision.quantity = roundTo8(ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'] - ia.tradeHistory[ia.pendingPositions[i]]['sell_exec']);
                }
                return decision;
            }
        }
    }

    if (!buyCons && openBuy != '') {
        decision.type = constants.cancel;
        decision.txid = openOrders[openBuy]['userref'];
    }else if (buyCons && openBuy == '' && ia.pendingPositions.length < config.maxBuy && (ia.pendingPositions.length == 0 || lowBuy * (1 - config.multipleBuys / 100) > bid)) {
        var buyBalance = 0.99 * balance[0] / (config.maxBuy - ia.pendingPositions.length);
        decision.order = 'buy';
        decision.type = constants.placeBuy;
        decision.ordertype = 'limit';
        decision.price = buyPrice;
        decision.quantity = roundTo8(buyBalance / buyPrice);
        decision.userref = newUserref();
    }else if (buyCons && openBuy != '' && bid > openOrders[openBuy]['descr']['price'] && ask > buyPrice) {
        var position = getPosition(openOrders[openBuy]['userref']);
        if (position != -1) {
            var pendingBuy = roundTo8(ia.tradeHistory[position]['volume'] - ia.tradeHistory[position]['buy_exec'] - openOrders[openBuy]['vol_exec']);
        } else {
            var pendingBuy = roundTo8(openOrders[openBuy]['descr']['price'] * (openOrders[openBuy]['vol'] - openOrders[openBuy]['vol_exec']) / buyPrice);
        }
        if (pendingBuy > ia.krakenMin) {
            decision.order = 'buy';
            decision.type = constants.updateBuy;
            decision.ordertype = 'limit';
            decision.price = buyPrice;
            decision.quantity = pendingBuy;
            decision.userref = openOrders[openBuy]['userref'];
            decision.txid = openOrders[openBuy]['userref'];
        }
    }
    return decision;
}

// input -> {bid, ask, value, balance, openOrders}
// output -> {order, ordertype, type, userref, txid, price, quantity, keys};
exports.decide = function(input) {
    updateHistory(input.value);
    updateLocalMinimum(input.value);
    if (ia.localHistory.length == config.local) {
        var orders = filterOrders(input.openOrders);
        var openBuy = getParameters(orders.openOrders);
        updateTradeHistory(orders, input.balance, input.bid);
        testing(orders);
        var decision = updateDecision(input.bid, input.ask, input.balance, openBuy, orders.openOrders);
    } else {
        var keys = [];
        var decision = {'type' : 'standby', 'keys' : keys};
    }
    return decision;
}

exports.initialize = function() {
    ia.tradeHistory = [];
    ia.localHistory = [];
    ia.pendingPositions = [];
    ia.userref = {};
    ia.lastDeleted = 0;
    ia.localMin = Infinity;

    var pair = config.pair;
    ia.krakenMin = config["krakenMin" + pair.substring(0, 3)];
    ia.spread = config["spread" + pair.substring(0, 3)];
}