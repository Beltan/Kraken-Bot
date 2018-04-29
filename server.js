// Server requires
var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static('public'));
var io = require('socket.io')(http);

// Bot requires
launcher = require('./main');

// Graphs requires
graph = require('./graphsData');

// Server init
http.listen(3000, function() {
    console.log('listening on *:3000');
});

// IO
io.on('connection', function(socket){
	socket.on('disconnect', function() {});
    socket.emit("chartData", graph.getHistoricGraph("balance"));
    socket.emit("chartData", graph.getHistoricGraph("balance", null, null, "logarithmic"));
    /*socket.emit("chartData", graph.getHistoricGraph("balanceCrypto"));
    socket.emit("chartData", graph.getHistoricGraph("balanceCrypto", null, null, "logarithmic"));
    socket.emit("chartData", graph.getHistoricGraph("buyPrice"));
    socket.emit("chartData", graph.getHistoricGraph("netPercentage"));*/
    socket.emit("stateData", launcher.state());
});

// Bot launch
launcher.main();