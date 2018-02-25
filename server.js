//Server requires
var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static('public'));
var io = require('socket.io')(http);

// Bot requires
api = require('./apiWrapper');
ia = require('./ia');

//Server init
http.listen(3000, function() {
    console.log('listening on *:3000');
});

//IO
io.on('connection', function(socket){
	socket.on('disconnect', function() {
		
    });
    //data: api.tradeHistory.map(a => Math.round(a.balance)),
    socket.emit("chartData", {
        id : 'test',
        type: 'line',
        data: {
            labels: Array(api.tradeHistory.length).fill(''),
            datasets: [{
                data: api.tradeHistory.map(a => Math.round(a.balance)),
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
});

//we init the simulation
api.initialize(pair = 'XRPUSD');

while(api.index < api.historic.length){
    if (config.realMode) {
        setInterval (api.depth, 15000);
    }
    api.getValues();
    ia.decide({bid, ask});
    api.execute(decision);
}

console.log(api.tradeHistory.map(a => a.balance));