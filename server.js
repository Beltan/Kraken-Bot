// Server requires
var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static('public'));
var io = require('socket.io')(http);

// Bot requires
api = require('./apiWrapper');
ia = require('./ia');

// Graphs requires
graph = require('./graphsData');

// Server init
http.listen(3000, function() {
    console.log('listening on *:3000');
});

// IO
io.on('connection', function(socket){
	socket.on('disconnect', function() {});
    socket.emit("chartData", graph.getHistoricGraph("balance", "type", "sell"));
    socket.emit("chartData", graph.getHistoricGraph("value"));
});

// Bot init
api.initialize(pair = 'XRPUSD');
var apiState = api.getApiState();

while (apiState.index < apiState.historic.length){
    var values = api.getValues();
    var decision = ia.decide(values);
    api.execute(decision);
}

console.log(apiState.tradeHistory.map(a => JSON.stringify(a)));