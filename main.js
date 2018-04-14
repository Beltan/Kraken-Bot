api = require('./api/apiWrapper');
ia = require('./ia');
var config = require('./config').api;

var data = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.main = async function() {
    api.initialize();
    ia.initialize();
    while (api.continue()){
        if (!config.simulation) {
            try {
                await sleep(3000);
            } catch (e) {}
        }
        try {
            var values = await api.getValues();
        } catch (e) {}
        if (values != undefined) {
            var decision = ia.decide(values);
            try {
                await api.execute(decision);
            } catch (e) {}
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