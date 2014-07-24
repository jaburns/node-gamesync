'use strict';

var FrameStack = require('./framestack');

// ----------------------------------------------------------------------------

function GameRunner (game, lag) {
  this._game = game;
  this._lag = typeof lag === 'number' ? lag : 0;

  this._frameStack = new FrameStack (game);

  this._clientSockets = [];
  this._ackInputs = [];
  this._stepInterval = -1;
}

GameRunner.prototype.removeClientSocket = function (socket) {
  var index = this._clientSockets.indexOf (socket);
  if (index >= 0) {
    this._clientSockets.splice (index, 1);
  }
  if (this._clientSockets.length < 1) {
    clearInterval (this._stepInterval);
  }
}

GameRunner.prototype.addClientSocket = function (socket) {
  if (this._clientSockets.length >= this._game.players) return null;
  if (this._clientSockets.indexOf (socket) >= 0) return null;
  this._clientSockets.push (socket);

  var firstInput = this._game.defaultInput ();
  firstInput.id = Math.random().toString().substr(2);
  this._frameStack.pushInput (firstInput);

  if (this._stepInterval < 0) {
    this._stepInterval = setInterval (this._step.bind(this), this._game.dt);
  }

  socket.json.send ({'notifyInputId': firstInput.id});

  return new ConnectedClient (this, firstInput.id);
}

function jsonClone (obj) {
  return JSON.parse (JSON.stringify (obj));
}

GameRunner.prototype._step = function () {
  var newState = this._frameStack.step ();

  if (this._ackInputs.length > 0) {
    newState.ackInputs = this._ackInputs;
    this._ackInputs = [];
  }

  if (this._lag) {
    setTimeout (function(){ this._sendState (newState); }.bind(this), this._lag);
  } else {
    this._sendState (newState);
  }
}

GameRunner.prototype._sendState = function (state) {
  for (var i = 0; i < this._clientSockets.length; ++i) {
    this._clientSockets[i].volatile.json.send (state);
  }
}

// ----------------------------------------------------------------------------

function ConnectedClient (runner, inputId) {
  this._inputId = inputId;
  this._runner = runner;
}

ConnectedClient.prototype.acceptInput = function (ackId, frame, input) {
  this._runner._ackInputs.push (ackId);
  input.id = this._inputId;

  this._runner._frameStack.input (frame, input);
}

// ----------------------------------------------------------------------------

module.exports = GameRunner;

