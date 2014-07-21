
"use strict";

var fs = require("fs");

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

    console.log ("RUNNING GAME");

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

    function GameRunner ()
    {
        var states = [{
            state: game.init (),
            frame: 0,
            inputs: []
        }];

        var clientSockets = [];
        var oldestModifiedInput = -1;
        var ackInputs = [];

        this.addClientSocket = function (socket)
        {
            if (clientSockets.length >= game.players) return null;

            var socketIndex = clientSockets.push (socket) - 1;
            var id = Math.random().toString().substr(2);

            // TODO think through how to properly add new inputs to the system.
            var firstInput = game.defaultInput ();
            firstInput.id = id;
            states[0].inputs.push (firstInput);

            return {
                inputId: id,
                acceptInput: function (ackId, frame, input) {
                    input.id = id;
                    oldestModifiedInput = frame;
                    ackInputs.push (ackId);

                    console.log ("Attempting input: " + JSON.stringify (input));
                    console.log ("Latest local frame: " + states[0].frame);
                    console.log ("Input happened at frame: " + frame);

                    for (var i = 0; i < states.length; ++i) {
                        if (states[i].frame === frame) {
                            for (var j = 0; j < states[i].inputs.length; ++j) {
                                if (states[i].inputs[j].id === id) {
                                    while (i >= 0) {
                                        states[i].inputs[j] = input;
                                        i--;
                                    }
                                    return;
                                }
                            }
                        }
                    }
                },
                kill: function () {
                    clientSockets.splice (socketIndex, 1);
                    // TODO think through how to remove input sources from the system
                }
            }
        }

        function pushToClients (data) {
            var doPush = function() {
                for (var i in clientSockets) {
                    clientSockets[i].volatile.json.send (data);
                }
            }
            if (lag > 0) {
                setTimeout (doPush, lag);
            } else {
                doPush ();
            }
        }

        setInterval (function() {
            if (oldestModifiedInput >= 0) {
                for (var i = 0; i < states.length; ++i) {
                    if (states[i].frame === oldestModifiedInput) break;
                }
                // now i == index of state to start simulating back from
                while (i > 0) {
                    states[i-1] = {
                        state: game.step (states[i].inputs, states[i].state),
                        frame: states[i].frame + 1,
                        inputs: states[i-1].inputs
                    };
                    i--;
                }
                oldestModifiedInput = -1;
            }

            var oldState = states[0];
            var newState = {
                state: game.step (oldState.inputs, oldState.state),
                frame: oldState.frame + 1,
                inputs: oldState.inputs.slice()
            };

            states.unshift (newState);
            if (states.length > 100) states.pop ();

            if (newState.frame % 60 === 0) {
                console.log (JSON.stringify (newState));
            }

            if (ackInputs.length > 0) {
                newState.ackInputs = ackInputs;
                ackInputs = [];
            }

            pushToClients (newState);
        },
        game.dt);
    }

    var gameRunner = new GameRunner ();

    io.sockets.on ("connection", function (socket) {
        var client = gameRunner.addClientSocket (socket);

        if (!client) {
            socket.json.send ({"error": "Too many players connected already!"});
            return;
        }

        socket.json.send ({"notifyInputId": client.inputId});

        socket.on ("disconnect", function () {
            client.kill ();
        });

        socket.on ("message", function (data) {
            client.acceptInput (data.ackId, data.frame, data.input);
        });
    });
}


