let api = {
    key: '', // API Key
    secret: '', // API Private Key
    simulation: true,
    candles: ['5m'], // 5m, 1h, 1d
}

let broker = {
    pair: [{
            first: 'XRP', 
            second: 'USDT'
        }]
}

let simulation = {
    startingBalance: {
        'USDT': 100,
        'XRP': 0
    }
}

/*
let ia = {
    sellPositive: 2,    // Percentage after which a winning trade will be closed.
    sellNegative: -10,  // Percentage after which a losing trade will be closed.
    local: 45,          // Number of last values checked for the local minimum.
    lowBuy: 0.01,       // Minimum percentage difference with the local low to open a trade.
    highBuy: 1.5,       // Maximum percentage difference with the local low to open a trade.
    maxBuy: 1,          // Maximum number of simultaneous trades.
    multipleBuys: 10,    // Percentage decrease that needs to happen before the next buy order can be placed, considering that there is already one trade opened.
    krakenMinXRP: 30,   // Minimum XRP that can be traded
    spreadXRP: 0.00001, // Minimum XRP spread
    krakenMinXBT: 0.002,// Minimum XBT that can be traded
    spreadXBT: 0.1,     // Minimum XBT spread
    krakenMinETH: 0.02, // Minimum ETH that can be traded
    spreadETH: 0.01,    // Minimum ETH spread
    krakenMinBCH: 0.002,// Minimum BCH that can be traded
    spreadBCH: 0.1      // Minimum BCH spread
}
*/

let ai = {
    aiName: "null",
    managerName: "generic",
    modules: [
        "localMinMax",
        {
        name: "localMinMax",
        config: {
            numberOfSamples: 1000
        }
    }]
}

let logger = {
    level: 'debug'
}

module.exports.ai = ai;
module.exports.api = api;
module.exports.broker = broker;
module.exports.simulation = simulation;
module.exports.logger = logger;