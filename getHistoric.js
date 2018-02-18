var fs = require('fs');
var contents = fs.readFileSync('C:\\Users\\emrbe\\OneDrive\\Documents\\GitHub\\key.js'.toString(), 'utf8').split('\n');
const key             = contents[0]; // API Key
const secret          = contents[1]; // API Private Key
const KrakenClient    = require('kraken-api');
const kraken          = new KrakenClient(key, secret);

var store = {
    pair: 'XRPUSD',
    last: 10000,
    historicCounter: 0,
    matrix: []
};

async function loop() {
    for (i = 0; i < 20; i++){
        await historic();
    }
}

async function historic() {
    pair = store.pair;
    since = store.last;
    await kraken.api('Trades', {pair, since}, printResultsTrades);
}

async function historicInit() {
    pair = store.pair;
    await kraken.api('Trades', {pair}, printResultsTrades);
}

function printResultsTrades(error, data) {
    if(error != null)
        console.log(error);
    else {
        store.last = data.result.last;
        store.matrix[store.historicCounter] = data.result.XXRPZUSD;
        store.historicCounter++;
        console.log(store.historicCounter);
    }
}

loop();