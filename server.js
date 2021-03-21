// Server requires
let express = require('express');
let app = express();
let http = require('http').Server(app);
app.use(express.static('public'));
let io = require('socket.io')(http);
const logs = require('./logger');
logs.init();
const logger = logs.logger();

// Bot requires
let launcher = require('./main');

// Graphs requires
let graph = require('./web/graphsData');

// Server init
http.listen(3000, function() {
    logger.info('Listening on *:3000');
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