functions = require('./functions');
store = require('./store');

// Initializes pair values
//functions.initialize('XRPUSD');

// Test with past values saved on a .csv
functions.botTest();

console.log(JSON.stringify(store.testBalance));

/*
// Real time values and test trading for the pair defined in store
setInterval (functions.trade, 10000);
setInterval (functions.depth, 10000);
setInterval (functions.historicInit, 10000);
*/