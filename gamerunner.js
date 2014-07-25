'use strict';

var FrameStack = require('./framestack');

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

// TODO
// Refactor 'inputs' array in Frame to be a hash keyed by played ID.

GameRunner.prototype.addClientSocket = function (socket) {
  if (this._clientSockets.length >= this._game.players) return null;
  if (this._clientSockets.indexOf (socket) >= 0) return null;
  this._clientSockets.push (socket);

  var playerId = Math.random().toString().substr(2);
  var firstInput = this._game.defaultInput ();

  firstInput.id = playerId;
  this._frameStack.pushInput (firstInput);

  if (this._stepInterval < 0) {
    this._stepInterval = setInterval (this._step.bind(this), this._game.dt);
  }

  socket.json.send ({'notifyInputId': firstInput.id});

  return {
    acceptInput: function (ackId, time, input) {
      this._ackInputs.push (ackId);
      input.id = playerId;
      this._frameStack.input (time, input);
    }.bind (this)
  };
}

GameRunner.prototype._step = function () {
  var newState = this._frameStack.step ();

  if (this._ackInputs.length > 0) {
    newState.ackInputs = this._ackInputs;
    this._ackInputs = [];
  }

  if (this._lag) {
    setTimeout (this._sendState.bind(this,newState), this._lag);
  } else {
    this._sendState (newState);
  }
}

GameRunner.prototype._sendState = function (state) {
  for (var i = 0; i < this._clientSockets.length; ++i) {
    this._clientSockets[i].volatile.json.send (state);
  }
}

module.exports = GameRunner;

