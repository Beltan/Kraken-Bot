api = require('./apiWrapper');
ia = require('./ia');

api.initialize(pair = 'XRPUSD');

while (api.index < api.historic.length){
    var values = api.getValues();
    var decision = ia.decide(values);
    api.execute(decision);
}