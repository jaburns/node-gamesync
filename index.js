'use strict';

var CLIENT_SCRIPT_PATH = '/gamesync-client.js';
var CLIENT_SCRIPT_URL = '/gamesync/client.js'

// ----------------------------------------------------------------------------

var clientScript = require('fs').readFileSync(__dirname+CLIENT_SCRIPT_PATH).toString();
var GameRunner = require('./gamerunner');

function addPriorityRequestListener (server, url, listener) {
  var oldListeners = server.listeners('request').splice(0);
  server.removeAllListeners('request');

  server.on('request', function (req, res) {
    if (req.url === url) {
      listener (req, res);
    }
    else {
      for (var i=0, l=oldListeners.length; i < l; i++) {
        oldListeners[i].call (server, req, res);
      }
    }
  });
}

module.exports.run = function (io, game, lag) {
  if (typeof lag === 'undefined') lag = 0;

  addPriorityRequestListener (io.server, CLIENT_SCRIPT_URL, function (req, res) {
    res.writeHead (200);
    res.end (clientJS);
  });

  var gameRunner = new GameRunner (game, lag);

  io.sockets.on ('connection', function (socket) {
    var client = gameRunner.addClientSocket (socket);

    if (!client) {
      socket.json.send ({'error': 'Too many players connected already!'});
      return;
    }

    socket.json.send ({'notifyInputId': client.inputId});

    socket.on ('disconnect', function () {
      gameRunner.removeClientSocket (socket);
    });

    socket.on ('message', function (data) {
      client.acceptInput (data.ackId, data.frame, data.input);
    });
  });
}


