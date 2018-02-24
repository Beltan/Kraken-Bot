functions = require('./functions');
store = require('./store');

// Initializes pair values
functions.initialize('XRPUSD');

// Test with past values saved on a .csv
functions.botTest();

/*
// Real time values and test trading for the pair defined in store
setInterval (functions.trade, 10000);
setInterval (functions.depth, 10000);
setInterval (functions.historicInit, 10000);
*/

// Gets the data of the specified pair and saves it on a .csv file
//setInterval(functions.getHistoric, 3000);

// Gets the data from the .csv file and saves the asked value in store.parameter
// functions.nextParameter(1);