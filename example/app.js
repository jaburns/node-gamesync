
"use strict";

var PORT = 1234;
var FILES = [ "/client.html", "/gamesync-client.js", "/game.js" ];

var app = require("http").createServer(handler);
var io = require("socket.io").listen(app);
var fs = require("fs");
var game = require("./game").game;
var gamesync = require("../gamesync");
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

    if (filepath === "/gamesync-client.js") {
        filepath = "/.." + filepath;
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

var lag = process.argv.length > 2
        ? parseInt (process.argv[2])
        : 0;

gamesync.run (io, game, lag);
