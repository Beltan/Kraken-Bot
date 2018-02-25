api = require('./apiWrapper');
ia = require('./ia');

api.initialize(realMode = false, pair = 'XRPUSD');

while(true){
    api.getValues();
    ia.decide(value);
    api.execute(decision);
}