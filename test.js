functions = require('./functions');
store = require('./store');


// Real time values and test trading for the pair defined in store
setInterval (functions.trade, 10000);
setInterval (functions.depth, 10000);
setInterval (functions.historicInit, 10000);

// Gets the data of the specified pair and saves it on a .csv file
// setInterval(function() {functions.getHistoric('XBTUSD');}, 3000);

// Gets the data from the .csv file and saves the asked value of the determined pair in store.parameter
// functions.nextParameter('XRPUSD', 1);