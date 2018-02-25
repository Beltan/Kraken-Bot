api = require('./apiWrapper');
ia = require('./ia');

api.initialize(pair = 'XRPUSD');

if (config.realMode) {
    setInterval (api.depth, config.timer);
    setInterval (api.getValues, config.timer);
    setInterval (function() {ia.decide({bid, ask});}, config.timer);
    setInterval (function() {ia.decide({decision});}, config.timer);
}else {
    while (api.index < api.historic.length){
        api.getValues();
        ia.decide({bid, ask});
        api.execute(decision);
    }
}