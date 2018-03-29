api = require('./api/apiWrapper');
ia = require('./ia');

var data = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.main = async function() {
    var pair = 'BCHEUR';
    api.initialize(pair);
    ia.initialize(pair);
    while (api.continue()){
        if (!config.simulation) {
            await sleep(3000);
        }
        var values = await api.getValues();
        if (values != undefined) {
            var decision = ia.decide(values);
            await api.execute(decision);
        }

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