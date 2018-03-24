api = require('./api/apiWrapper');
ia = require('./ia');

var data = [];

exports.main = function() {
    var pair = 'XRPUSD';
    var keys = [];
    api.initialize(pair);
    ia.initialize(pair);
    while (api.continue()){
        var values = api.getValues(keys);
        var decision = ia.decide(values);
        var keys = api.execute(decision);

        // Save data to have a track of what is the bot doing
        var stats = {values : values, decision : decision};
        data.push(stats);
    }

    console.log("Finished");
    // we could for example save in a csv all the data history... 
}

exports.state = function() {
    // we return the last data object when asked for the state
    return data[data.length - 1];   
}