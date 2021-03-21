const api = require('./api/apiWrapper');
const ai = require('./ai/aiCore');
const logger = require('./logger').logger();
const store = require('./store');

function continues() {
    return api.continue() && ai.continue();
}

exports.main = async function() {
    logger.info("Started");
    api.init();
    ai.init();
    
    while (continues()){
        await api.getValues();
        logger.debug(`New bid: ${store.bid}. New ask: ${store.ask}`);
        let instructions = ai.decide();
        await api.execute(instructions);
    }
}