var express = require('express');
var app = express();
var http = require('http').Server(app);
app.use(express.static('public'));

app.get('/test', function(req, res) {
    res.send("Hello this is a test");
});

//Server
http.listen(3000, function() {
    console.log('listening on *:3000');
});