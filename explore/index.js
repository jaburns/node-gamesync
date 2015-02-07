var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 1337;
app.use(express.static(__dirname));
app.get('/', function(req, res) { res.sendFile(__dirname + '/index.html'); });
http.listen(port, function() { console.log('Listening on ' + port); });

var shared = require('./shared');


var INCOMING_LAG = 120;
var OUTGOING_LAG = 120;



var state = {
    time: 0,
    players: {}
};

function newPlayer () {
    return {
        x:800*Math.random(),
        y:600*Math.random(),
        vx:0,
        vy:0,
        latestInput:{}
    };
}

function handleInput(id, inputBuffer) {
    if (state.players[id]) {
       state.players[id].latestInput = inputBuffer;
    }
}



var sockets = [];

io.on('connection', function(socket) {
    console.log ('Hi '+socket.id);
    sockets.push(socket);
    state.players[socket.id] = newPlayer();

    socket.on('msg input', function(inputBuffer) {
        setTimeout(handleInput.bind(null, socket.id, inputBuffer), INCOMING_LAG);
    });

    socket.on('disconnect', function() {
        delete state.players[socket.id];
        sockets.splice(sockets.indexOf(socket), 1);
        console.log ('Bye '+socket.id);
    });
});



setInterval(function() {
    state.time++;

    for (var k in state.players) {
        var p = state.players[k];
        shared.stepPlayer(p, p.latestInput);
    }

    var stateNow = JSON.parse(JSON.stringify(state));
    setTimeout(function() {
        for (var i=0; i < sockets.length; ++i) {
            sockets[i].volatile.emit('msg state', stateNow);
        }
    },OUTGOING_LAG);
},
50);

