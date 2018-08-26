const config = require('./../config').api;
const constants = require('./../constants');

var api;
if (config.simulation) api = require('./simulationApi');
else api = require('./api');

var tradeHistoric;

// ---- PUBLIC FUNCTIONS -----

exports.execute = async function(instructions) {

    for(var i in instructions) {
        var instruction = instructions[i];
        var result = await api.executeFunctions[instruction.type](instruction);
    }
}

exports.init = function(pair) {
    api.init(pair);
    api.keys = [];
    tradeHistoric = {};
}

exports.getTradeHistoric = function() {
    return tradeHistoric;
}

exports.continue = api.continue;
exports.getValues = api.getValues;