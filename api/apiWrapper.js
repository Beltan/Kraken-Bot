const config = require('./../config').api;
const constants = require('./../constants');

var api;
if (config.simulation) api = require('./simulationApi');
else api = require('./api');

// tradeHistoric : { txid : [decisionResult, movement, decisionResult], txid : ...}
var tradeHistoric;

// ---- PRIVATE FUNCTIONS ----

var addToHistory = function(result) {
    if(result.type == constants.placeBuy) {
        tradeHistoric[result.txid] = [result];
    }
    else {
        tradeHistoric[result.position].push(result);
    }
}

// ---- PUBLIC FUNCTIONS -----

exports.execute = function(decision) {
    if(decision.type != "standby") {
        var result = api.executeFunctions[decision.type](decision);
        addToHistory(result);
    }   
}

exports.initialize = function(pair) {
    api.initialize(pair);
    tradeHistoric = {};
}

exports.getTradeHistoric = function() {
    return tradeHistoric;
}

exports.continue = api.continue;
exports.getValues = api.getValues;