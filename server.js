//Server requires
var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static('public'));
var io = require('socket.io')(http);

// Bot requires
functions = require('./functions');
store = require('./store');

//Server init
http.listen(3000, function() {
    console.log('listening on *:3000');
});

//IO
io.on('connection', function(socket){
	socket.on('disconnect', function() {
		
    });
    //data: store.tradeHistory.map(a => Math.round(a.balance)),
    socket.emit("chartData", {
        id : 'test',
        type: 'line',
        data: {
            labels: Array(store.tradeHistory.length).fill(''),
            datasets: [{
                data: store.tradeHistory.map(a => Math.round(a.balance)),
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
functions.botTest();

console.log(store.tradeHistory.map(a => a.balance));