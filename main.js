api = require('./api/apiWrapper');
ia = require('./ia');
var config = require('./config').api;

var data = [];

exports.main = async function() {
    api.initialize();
    ia.initialize();

    while (api.continue()){
        var values = await api.getValues();
        if (values) {

            var decision = ia.decide(values);
            await api.execute(decision);

            // Save data to have a track of what is the bot doing
            var stats = {values : values, decision : decision};
            data.push(stats);
        }
       
    }

    console.log("Finished");
    // we could for example save in a csv all the data history... 
}

exports.state = function() {
    // we return the last data object when asked for the state
    return data[data.length - 1];   
}