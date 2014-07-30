'use strict';

var CLIENT_SCRIPT_PATH = '/gamesync-client.js';
var CLIENT_SCRIPT_URL = '/gamesync/client.js'

// ----------------------------------------------------------------------------

var clientScript = require('fs').readFileSync(__dirname+CLIENT_SCRIPT_PATH).toString();
var socketio = require('socket.io');
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

module.exports.run = function (server, game, lag) {
  if (typeof lag === 'undefined') lag = 0;

  var io = socketio.listen (server);
  io.set ('log level', 2);

  addPriorityRequestListener (server, CLIENT_SCRIPT_URL, function (req, res) {
    res.writeHead (200);
    res.end (clientScript);
  });

  var gameRunner = new GameRunner (game, lag);

  io.sockets.on ('connection', function (socket) {
    var client = gameRunner.addClientSocket (socket);

    if (!client) {
      socket.json.send ({'error': 'Too many players connected already!'});
      return;
    }

    socket.on ('disconnect', function () {
      gameRunner.removeClientSocket (socket);
    });

    socket.on ('message', function (data) {
      client.acceptInput (data.ackId, data.time, data.input);
    });
  });
}

