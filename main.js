api = require('./apiWrapper');
ia = require('./ia');

exports.main = function(apiState) {
    api.initialize(pair = 'XRPUSD');
    while (apiState.index < apiState.historic.length){
        var values = api.getValues();
        var decision = ia.decide(values);
        api.execute(decision);
    }
}