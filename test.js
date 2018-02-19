config = require('./config');
store = require('./store');
const KrakenClient = require('kraken-api');
const key = config.key; // API Key
const secret = config.secret; // API Private Key
const kraken = new KrakenClient(key, secret);

async function loop() {
    for (i = 0; i < 5; i++){
        await historic();
    }
    await unify();
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

function unify() {
    for (i = 0; i < store.matrix.length; i++){
        for (j = 0; j < 1000; j++){
            store.data[i * 1000 + j] = store.matrix[i][j][0];
        }
    }
}

loop();