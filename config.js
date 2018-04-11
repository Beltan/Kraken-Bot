var pair = "XRPUSD";

var api = {
    key: '6eIPFTFkyjZtIv5yPH8/msbYt0+7JQID7b2GLqUoLcp35Si/hFixkVYT', // API Key
    secret: 'KL1gTEyaik7UYm4ctzpkwGt0TIQJq4myQSdb5XNekM/Qj6rh5P3f0OyZo9RoZFQSf9dpENk+piDJkbxKrROf7A==', // API Private Key
    simulation: true,
    saveAllHistory : true
}

var ia = {
    sellPositive: 2,    // Percentage after which a winning trade will be closed.
    sellNegative: -10,  // Percentage after which a losing trade will be closed.
    local: 45,          // Number of last values checked for the local minimum.
    lowBuy: 0.01,       // Minimum percentage difference with the local low to open a trade.
    highBuy: 1.5,       // Maximum percentage difference with the local low to open a trade.
    maxBuy: 1,          // Maximum number of simultaneous trades.
    multipleBuys: 10,   // Percentage decrease that needs to happen before the next buy order can be placed, considering that there is already one trade opened.
    krakenMinXRP: 30,   // Minimum XRP that can be traded
    spreadXRP: 0.00001, // Minimum XRP spread
    krakenMinXBT: 0.002,// Minimum XBT that can be traded
    spreadXBT: 0.1,     // Minimum XBT spread
    krakenMinETH: 0.02, // Minimum ETH that can be traded
    spreadETH: 0.01,    // Minimum ETH spread
    krakenMinBCH: 0.002,// Minimum BCH that can be traded
    spreadBCH: 0.1      // Minimum BCH spread
}

api.pair = pair;
ia.pair = pair;

module.exports.ia = ia;
module.exports.api = api;