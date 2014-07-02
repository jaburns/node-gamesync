
"use strict";

var PORT = 1234;
var FILES = [ "/client.html", "/game.js" ];

var app = require("http").createServer(handler);
var io = require("socket.io").listen(app);
var fs = require("fs");
var vm = require("vm");
app.listen (PORT);

io.set ("log level", 2);

function handler (req, res)
{
    var filepath = req.url;

    if (filepath === "/") filepath = FILES[0];

    if (FILES.indexOf (filepath) < 0) {
        res.writeHead (500);
        return res.end ("durr");
    }

    fs.readFile(__dirname + filepath,
        function (err, data) {
            if (err) {
                res.writeHead (500);
                return res.end ("durrrr");
            }
            res.writeHead (200);
            res.end (data);
        }
    );
}

// ------------------------------------------------------------------------------------------------

var includeInThisContext = function (path) {
    var code = fs.readFileSync (path);
    vm.runInThisContext (code, path);
}.bind (this);

includeInThisContext (__dirname+"/game.js");

// ------------------------------------------------------------------------------------------------

function GameRunner (socket)
{
    var state = game.init ();
    var frameIndex = 0;
    var clientSockets = [];
    var inputs = [];

    this.addClientSocket = function (socket) {
        if (clientSockets.length >= 2) return false;
        clientSockets.push (socket);
        return true;
    }

    this.killClientSocket = function (socket) {
        clientSockets.splice (clientSockets.indexOf (socket), 1);
    }

    this.acceptInput = function (socket, frame, input) {
        inputs [clientSockets.indexOf (socket)] = input;
        console.log (frame - frameIndex);
    }

    function pushStateToClients () {
        setTimeout (function () {
            for (var i in clientSockets) {
                clientSockets[i].volatile.json.send ({
                    state: state,
                    frame: frameIndex
                });
            }
        }
        , 50);
    }

    setInterval (function() {
        frameIndex++;
        state = game.step (inputs, state);
        pushStateToClients ();
    },
    game.dt);
}

var gameRunner = new GameRunner ();

io.sockets.on ("connection", function (socket) {
    if (! gameRunner.addClientSocket (socket)) {
        socket.json.send ({"error": "Too many players connected already!"});
        return;
    }

    socket.on ("disconnect", function () {
        gameRunner.killClientSocket (socket);
    });

    socket.on ("message", function (data) {
        gameRunner.acceptInput (socket, data.frame, data.input);
    });
});




