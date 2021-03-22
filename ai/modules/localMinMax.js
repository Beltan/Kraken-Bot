const math = require('mathjs');
const globalConfig = require('../../config');
const logger = require('../../logger').logger();

exports.dependencies = [];

exports.update = function(config, state, store) {
    
    const frameStart = math.max(0, store.candles.length - config.numberOfSamples);
    const timeFrame = config.timeFrame ? config.timeFrame : globalConfig.api.candles[0]; 

    let minValues = [];
    let maxValues = [];
    for (let i = frameStart; i < frameStart + config.numberOfSamples; i++) {
        minValues.push(math.bignumber(store.candles[timeFrame][i][3]));
        maxValues.push(math.bignumber(store.candles[timeFrame][i][2]));
    }

    let minValue = math.min(minValues);
    let maxValue = math.max(maxValues);

    logger.debug(`localMinMax - Min: ${minValue} Max: ${maxValue}`);

    let decision = { minValue, maxValue };
    return decision;
}

exports.init = function(params) {}