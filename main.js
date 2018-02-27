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

        // the above code should be...
        /*
            var values = api.getValues();
            var instruction = ia.decide(values);
            api.execute(instruction); //Look how beatifull is this instruction!!
        */
            /* You are telling to the api:
             Please api, can you kindly execute this instruction?
             but the ia, knows nothing about how to execute the instrucion, and it doens't care!!!
             it's job is to decide what is the next instruction, 
             HOW to execute it? that's for the api :) 
            */
    }
}