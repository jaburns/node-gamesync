"use strict";

var fs = require("fs");
var GameRunner = require("./gamerunner");

var clientJS;

fs.readFile (__dirname+"/gamesync-client.js", function (err, data) {
    if (err) {
        console.log ("Could not find gamesync-client.js");
        process.exit (1);
    }
    clientJS = data;
});

exports.run = function (io, game, lag)
{
    if (typeof lag === "undefined") lag = 0;

    var oldListeners = io.server.listeners('request').splice(0);
    io.server.removeAllListeners('request');

    io.server.on("request", function (req, res) {
        if (req.url === "/gamesync/client.js") {
            res.writeHead (200);
            res.end (clientJS);
        }
        else {
            for (var i=0, l=oldListeners.length; i < l; i++) {
                oldListeners[i].call (io.server, req, res);
            }
        }
    });

    var gameRunner = new GameRunner (game, lag);

    io.sockets.on ("connection", function (socket) {
        var client = gameRunner.addClientSocket (socket);

        if (!client) {
            socket.json.send ({"error": "Too many players connected already!"});
            return;
        }

        socket.json.send ({"notifyInputId": client.inputId});

        socket.on ("disconnect", function () {
            gameRunner.removeClientSocket (socket);
        });

        socket.on ("message", function (data) {
            client.acceptInput (data.ackId, data.frame, data.input);
        });
    });
}


