api = require('./apiWrapper');
ia = require('./ia');

api.initialize(pair = 'XRPUSD');

while(api.index < api.historic.length){
    if (config.realMode) {
        setInterval (api.depth, 15000);
    }
    api.getValues();
    ia.decide({bid, ask});
    api.execute(decision);
}