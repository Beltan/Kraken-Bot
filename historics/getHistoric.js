functions = require('./historicFunctions');

// Initializes pair values
functions.initialize('XBTUSD');

// Gets the data of the specified pair and saves it on a .csv file
setInterval(functions.getHistoric, 3000);