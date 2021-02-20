const api = require('./api/apiWrapper');
const ai = require('./ai/aiCore');

function continues() {
    return api.continue() && ai.continue();
}

exports.main = async function() {

    console.log("Started");

    api.init();
    ai.init();

    console.log("Started processing values");
    while (continues()){
        await api.getValues();
        let instructions = ai.decide();
        await api.execute(instructions);
    }

    console.log("Finished");
    // we could for example save in a csv all the data history... 
}