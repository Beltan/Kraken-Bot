config = require('./config').ia;
const fs = require('fs');

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
        if (openOrders[key]['status'] == 'closed' || openOrders[key]['status'] == 'canceled') {
            Object.assign(closedOrders, openOrders[key]);
            delete openOrders[key];
        }
    }
    return {openOrders, closedOrders};
}

function getParameters(openOrders) {
    var openBuys = {'counter' : 0, 'keys' : []};
    for (var key in openOrders) {
        if (openOrders[key]['descr']['type'] == 'buy') {
            openBuys.keys[openBuys.counter] = key;
            openBuys.counter++;
        }
    }
    return openBuys;
}

function updateTradeHistory(closedOrders) {
    for (var key in closedOrders) {
        if (closedOrders[key]['status'] == 'closed' || closedOrders[key]['vol_exec'] != 0) {
            if ((closedOrders[key]['status'] == 'cancelled') || (closedOrders[key]['status'] == 'closed' && closedOrders[key]['descr']['type'] == buy)) {
                var history = {'position' : ia.tradeHistory.length, 'userref' : key, 'buyPrice' : closedOrders[key]['price'], 'quantity' : closedOrders[key]['vol_exec'], 'buyCommission' : closedOrders[key]['fee']};
                for (i = 0; i < ia.openTrades.length; i++) {
                    if (ia.opentrades[i]['userref'] == key) {
                        average = ia.volume * ia.average + closedOrders[key]['vol_exec'] * closedOrders[key]['price'];
                        volume = ia.volume + closedOrders[key]['vol_exec'];
                        fee = ia.fee + closedOrders[key]['fee'];
                        history = {'position' : ia.tradeHistory.length - 1, 'userref' : key, 'buyPrice' : average, 'quantity' : volume, 'buyCommission' : fee};
                    }
                }
                var index = ia.openTrades.findIndex(i => i.userref == key);
                var position = ia.openTrades[index][position];
                ia.openTrades.slice(index, 1);
                ia.openTrades.push(history);
                ia.tradeHistory.slice(position, 1);
                ia.tradeHistory.push(history);
            }if (closedOrders[key]['descr']['type'] == 'sell') {
                var history = {'sellPrice' : closedOrders[key]['price'], 'sellCommission' : closedOrders[key]['fee']};
                var index = ia.openTrades.findIndex(i => i.userref == key);
                var position = ia.openTrades[index][position];
                Object.assign(ia.tradeHistory[index], history);
            }
        }
    }
}

function buyConditions(bid) {
    var buyConditions = false;
    var buyIncrease = 100 * (bid - ia.localMin) / ia.localMin;
    if ((p.buyIncrease >= config.lowBuy) && (p.buyIncrease <= config.highBuy)) {
        buyConditions = true;
    }
    return buyConditions;
}

//n -> input
function updateDecision(n, openBuys, orders) {
    var decision = {'type' : 'standby'};
    var buyConditions = buyConditions (n.bid);
    var length = Object.keys(openOrders).length;

    if (!buyConditions && openBuys.counter == 1) {
        decision = {'type' : "cancel buy order", 'userref' : openBuys.keys[0]};
    }else if (buyConditions && (length == 0 || (openBuys.counter == 0 && length < config.maxBuy))) {
        var buyBalance = n.balance / (config.maxBuy - length);
        ia.volume = 0;
        ia.average = 0;
        ia.fee = 0;
        decision = {'type' : 'place buy order', 'price' : n.bid + ia.spread, 'quantity' : buyBalance, 'close' : {'ordertype' : 'stop-loss-profit', 'price' : (n.bid + ia.spread) + (1 + config.sellPositive / 100), 'price2' : (n.bid + ia.spread) + (1 + config.sellNegative / 100)}};
    }else if (buyConditions && openBuys.counter == 1 && n.bid > orders.openOrders[openBuys.keys[0]]['descr']['price']) {
        if (orders.openOrders[openBuys.keys[0]]['vol_exec'] == 0) {
            var buyBalance = n.balance / (config.maxBuy - length);
            decision = {'type' : 'update buy order', 'userref' : openBuys.keys[0], 'price' : n.bid + ia.spread, 'quantity' : buyBalance, 'close' : {'ordertype' : 'stop-loss-profit', 'price' : (n.bid + ia.spread) + (1 + config.sellPositive / 100), 'price2' : (n.bid + ia.spread) + (1 + config.sellNegative / 100)}};
        }else {
            var pendingBuy = orders.openOrders[openBuys.keys[0]]['vol'] - orders.openOrders[openBuys.keys[0]]['vol_exec'];
            if (buyConditions && pendingBuy > (ia.krakenMin * (n.bid + ia.spread))) {
                ia.average = (ia.average * ia.volume + orders.openOrders[openBuys.keys[0]]['price'] * orders.openOrders[openBuys.keys[0]]['vol']) / (ia.volume + orders.openOrders[openBuys.keys[0]]['vol']);
                ia.volume = ia.volume + orders.openOrders[openBuys.keys[0]]['vol'];
                ia.fee = ia.fee + orders.openOrders[openBuys.keys[0]]['fee']
                decision = {'type' : 'update buy order', 'userref' : openBuys.keys[0], 'price' : n.bid + ia.spread, 'quantity' : pendingBuy, 'close' : {'ordertype' : 'stop-loss-profit', 'price' : ia.average + (1 + config.sellPositive / 100), 'price2' : ia.average + (1 + config.sellNegative / 100)}};
            }
        }
    }
    return decision;
}

// input -> {bid, ask, value, balance, openOrders}
// output -> {type, price, quantity, close};
exports.decide = function(input) {
    updateHistory(input.value);
    updateLocalMinimum(input.value);
    var orders = filterOrders(input.openOrders);
    var openBuys = getParameters(orders.openOrders);
    updateTradeHistory(orders.closedOrders);
    var decision = updateDecision(input, openBuys, orders);
    return decision;
}

exports.initialize = function(pair) {
    ia.volume = 0;
    ia.average = 0;
    ia.fee = 0;
    ia.openTrades = [];
    ia.tradeHistory = [];
    ia.localHistory = [];
    ia.lastDeleted = 0;
    ia.localMin = Infinity;
    ia.krakenMin = eval('config.krakenMin' + pair.substring(0, 3));
    ia.spread = eval('config.spread' + pair.substring(0, 3));
}
