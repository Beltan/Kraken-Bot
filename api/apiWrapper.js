const config = require('./../config').api;
const constants = require('./../constants');

let api;
if (config.simulation) api = require('./simulationApi');
else api = require('./api');

// ---- PUBLIC FUNCTIONS -----

exports.execute = async function(instructions) {
    for (let i in instructions) {
        let instruction = instructions[i];
        await api.executeFunctions[instruction.type](instruction);
    }
}

exports.getHistoric = async function () {
    await sleep(1000);

    try {
        let values = await binance.candlesticks(broker.pair[0], broker.interval);
        return values;
    } catch (e) {
        console.log('Error while retrieving info, trying again... -> ' + e);
    }
}

exports.init = function() {
    api.init();
}

exports.continue = api.continue;
exports.getValues = api.getValues;