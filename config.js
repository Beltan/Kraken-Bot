module.exports = {
    key: '6eIPFTFkyjZtIv5yPH8/msbYt0+7JQID7b2GLqUoLcp35Si/hFixkVYT', // API Key
    secret: 'KL1gTEyaik7UYm4ctzpkwGt0TIQJq4myQSdb5XNekM/Qj6rh5P3f0OyZo9RoZFQSf9dpENk+piDJkbxKrROf7A==', // API Private Key
    sellPositive: 2,    // Percentage after which a winning trade will be closed.
    sellNegative: -10,  // Percentage after which a losing trade will be closed.
    local: 45,          // Number of last values checked for the local minimum.
    lowBuy: 0.01,        // Minimum percentage difference with the local low to open a trade.
    highBuy: 1.5,       // Maximum percentage difference with the local low to open a trade.
    realMode: false,
    timer: 15000
}