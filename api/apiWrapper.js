const config = require('./../config').api;

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

exports.init = function() {
    api.init();
}

exports.continue = api.continue;
exports.getValues = api.getValues;