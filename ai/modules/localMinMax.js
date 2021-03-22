let store = require('../../store');
const constants = require('../../constants');
const math = require('mathjs');

exports.dependencies = [];

exports.update = function(params) {
    //let values = params.values;
    params = {
        starttime: 1611769370000,
        endtime: Date.now() - 3601
    }

    let timePeriod = params.endtime - params.starttime;
    let timeFromNow = Date.now() - params.endtime;
    let timeFrame;
    let frameNum = 0;
    let frameStart = 0;

    // Get smallest timeframe that fits period for maximum accuracy
    if (timeFromNow + timePeriod < constants.fivemin * 1000) {
        timeFrame = '5m';
        frameNum = Math.ceil(timePeriod / constants.fivemin);
        frameStart = Math.ceil(timeFromNow / constants.fivemin);
    } else if (timeFromNow + timePeriod < constants.onehour * 1000) {
        timeFrame = '1h';
        frameNum = Math.ceil(timePeriod / constants.onehour);
        frameStart = Math.ceil(timeFromNow / constants.onehour);
    } else if (timeFromNow + timePeriod < constants.oneday * 1000) {
        timeFrame = '1d';
        frameNum = Math.ceil(timePeriod / constants.oneday);
        frameStart = Math.ceil(timeFromNow / constants.oneday);
    } else return null; //timeFrame too big

    let minValues = [];
    let maxValues = [];
    for (let i = frameStart; i < frameStart + frameNum; i++) {
        minValues.push(math.bignumber(store.candles[timeFrame][i][3]));
        maxValues.push(math.bignumber(store.candles[timeFrame][i][2]));
    }

    let minValue = math.min(minValues);
    let maxValue = math.max(maxValues);

    console.log("Min: " + minValue);
    console.log("Max: " + maxValue);

    let decision = { minValue, maxValue };
    return decision;
}

exports.init = function(params) {}