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
    return position;
}

function updateTradeHistory(closedOrders) {
    for(var key in closedOrders) {
        var position = getPosition(closedOrders[key]['userref']);
        if (closedOrders[key]['descr']['type'] == 'buy') {
            if (position != -1) {
                var average = ia.tradeHistory[position]['buyPrice'] * ia.tradeHistory[position]['buy_exec'] + closedOrders[key]['price'] * closedOrders[key]['vol_exec'] / (ia.tradeHistory[position]['buy_exec'] + closedOrders[key]['vol_exec']);
                ia.tradeHistory[position]['buyPrice'] = average;
                ia.tradeHistory[position]['buy_exec'] += closedOrders[key]['vol_exec'];
                ia.tradeHistory[position]['buyComission'] += closedOrders[key]['fee'];
                ia.tradeHistory[position]['fiat_exec'] = ia.tradeHistory[position]['buy_exec'] * ia.tradeHistory[position]['buyPrice'];
            }else {
                var history = {'txid' : key, 'buyPrice' : closedOrders[key]['price'], 'fiat_total' : closedOrders[key]['vol'] * closedOrders[key]['price'], 'fiat_exec' : closedOrders[key]['vol_exec'] * closedOrders[key]['price'], 'buy_exec' : closedOrders[key]['vol_exec'], 'volume' : closedOrders[key]['vol'], 'buyCommission' : closedOrders[key]['fee'], 'sellPrice' : 0, 'vol_exec' : 0, 'sellCommission' : 0, 'placed' : 'no'};
                ia.tradeHistory.push(history);
                ia.pendingPositions[tradeHistory.length] = tradeHistory.length - 1;
            }
        } else {
            var average = ia.tradeHistory[position]['sellPrice'] * ia.tradeHistory[position]['sell_exec'] + closedOrders[key]['price'] * closedOrders[key]['vol_exec'] / (ia.tradeHistory[position]['sell_exec'] + closedOrders[key]['vol_exec']);
            ia.tradeHistory[position]['sellPrice'] = average;
            ia.tradeHistory[position]['sell_exec'] += closedOrders[key]['vol_exec'];
            ia.tradeHistory[position]['sellComission'] += closedOrders[key]['fee'];
            if (ia.tradeHistory[position]['buy_exec'] == ia.tradeHistory[position]['sell_exec']) {
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

function updateDecision(bid, balance, openBuy, openOrders) {
    var buyConditions = buyConditions (bid);
    var keys = Object.keys(openOrders)
    var buyPrice = bid + ia.spread;
    var decision = {'type' : 'standby', 'keys' : keys};

    if (!buyConditions && openBuy != '') {
        decision.type = constants.cancel;
        decision.txid = openBuy;
    }else if (buyConditions && openBuy == '' && keys.length < config.maxBuy) {
        var buyBalance = balance / (config.maxBuy - keys.length);
        decision.type = constants.placeBuy;
        decision.price = buyPrice;
        decision.quantity = buyBalance / buyPrice;
    }else if (buyConditions && openBuy != '' && bid > openOrders[openBuy]['descr']['price']) {
        if (openOrders[openBuy]['userref'] != '') {
            var position = getPosition(openOrders[openBuy]['userref']);
        } else {
            var position = getPosition(openBuy);
        }
        var pendingBuy = ia.tradeHistory[position]['fiat_total'] - ia.tradeHistory[position]['fiat_exec'];
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
                ia.tradeHistory[ia.pendingPositions[i]]['placed'] == 'yes';
                decision.type = constants.placeSell;
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['txid'];
                decision.price = ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellPositive / 100);
                decision.quantity = ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'];
                return decision;
            } else if (ia.tradeHistory[ia.pendingPositions[i]]['buyPrice'] * (1 + config.sellNegative / 100) > bid) {
                decision.type = constants.placeSell;
                decision.userref = ia.tradeHistory[ia.pendingPositions[i]]['txid'];
                decision.price = 'market';
                decision.quantity = ia.tradeHistory[ia.pendingPositions[i]]['buy_exec'] - ia.tradeHistory[ia.pendingPositions[i]]['sell_exec'];
                return decision;
            }
        }
    }
    return decision;
}

// input -> {bid, ask, value, balance, openOrders}
// output -> {type, userref, txid, price, quantity, keys};
exports.decide = function(input) {
    updateHistory(input.value);
    updateLocalMinimum(input.value);
    var orders = filterOrders(input.openOrders);
    var openBuy = getParameters(orders.openOrders);
    updateTradeHistory(orders.closedOrders);
    var decision = updateDecision(input.bid, input.balance, openBuy, orders.openOrders);
    return decision;
}

exports.initialize = function(pair) {
    ia.tradeHistory = [];
    ia.localHistory = [];
    ia.pendingPositions = [];
    ia.lastDeleted = 0;
    ia.localMin = Infinity;
    ia.krakenMin = eval('config.krakenMin' + pair.substring(0, 3));
    ia.spread = eval('config.spread' + pair.substring(0, 3));
}