'use strict';

var PORT = 1234;
var FILES = [ '/pong.html', '/pong.js' ];

var lag = process.argv.length > 2
        ? parseInt (process.argv[2])
        : 0;

var server = require ('http').createServer (handler);
var fs = require ('fs');

function handler (req, res) {
  var filepath = req.url;

  if (filepath === '/') filepath = FILES[0];

  if (FILES.indexOf (filepath) < 0) {
    res.writeHead (404);
    return res.end ('404');
  }

  fs.readFile (__dirname + filepath, function (err, data) {
    if (err) {
      res.writeHead (500);
      return res.end ('500');
    }
    res.writeHead (200);
    return res.end (data);
  });
}

var game = require ('./pong');
require ('..').run (server, game, lag);
server.listen (PORT);
