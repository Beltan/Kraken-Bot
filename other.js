/*
function time() {
    var timeStart;
    var timeEnd;
    timeStart = Date.now();
    kraken.api('Time', {}, printResultsTime);
}

function printResultsTime(error, data) {
    timeEnd = Date.now();

    if(error != null)
        console.log(error);
    else
        console.log(timeEnd - timeStart);
        console.log(JSON.stringify(data.result));
}

function balance() {
    kraken.api('Balance', {}, printResults);
}

function printResults(error, data) {
    if(error != null)
        console.log(error);
    else
        console.log(JSON.stringify(data.result));
}

function ticker() {
    var pair = 'XRPUSD';
    kraken.api('Ticker', {pair}, printResultsTicker);
}

function printResultsTicker(error, data) {
    if(error != null)
        console.log(error);
    else
        history.push(data.result.XXRPZUSD.c[0]);
        for (i = 0; i<history.length; i++){
            console.log(history[i]);
        }
}
*/