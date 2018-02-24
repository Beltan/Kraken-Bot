var api = require('./api_wrapper');

var printValue = function() {
    var price = api.getCurrentOrders();
    console.log(JSON.stringify(price));
}

setInterval (printValue, 10000);