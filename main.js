const api = require('./api/apiWrapper');
const ai = require('./ai/aiCore');
const logger = require('./logger').logger();

function continues() {
    return api.continue() && ai.continue();
}

exports.main = async function() {
    logger.info("Started");
    api.init();
    ai.init();
    
    while (continues()){
        let store = await api.getValues();
        logger.debug(`New bid: ${store.bid}. New ask: ${store.ask}`);
        let instructions = ai.decide(store);
        await api.execute(instructions);
    }
}