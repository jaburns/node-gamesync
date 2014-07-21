'use strict';

var MAX_STATES = 100;

// ----------------------------------------------------------------------------

function GameRunner (game, lag) {
  this._game = game;
  this._lag = typeof lag === 'number' ? lag : 0;

  this._states = [{
    state: game.init (),
    frame: 0,
    inputs: []
  }];

  this._clientSockets = [];
  this._oldestModifiedInput = -1;
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
  this._states[0].inputs.push (firstInput);

  if (this._stepInterval < 0) {
    this._stepInterval = setInterval (this._step.bind(this), this._game.dt);
  }

  return new ConnectedClient (this, firstInput.id);
}

GameRunner.prototype._step = function () {
  if (this._oldestModifiedInput >= 0) {
    for (var i = 0; i < this._states.length; ++i) {
      if (this._states[i].frame === this._oldestModifiedInput) break;
    }
    while (i > 0) {
      this._states[i-1] = {
        state: this._game.step (this._states[i].inputs, this._states[i].state),
        frame: this._states[i].frame + 1,
        inputs: this._states[i-1].inputs
      };
      i--;
    }
    this._oldestModifiedInput = -1;
  }

  var oldState = this._states[0];
  var newState = {
    state: this._game.step (oldState.inputs, oldState.state),
    frame: oldState.frame + 1,
    inputs: oldState.inputs.slice()
  };

  if (this._ackInputs.length > 0) {
    newState.ackInputs = this._ackInputs;
    this._ackInputs = [];
  }

  this._states.unshift (newState);
  if (this._states.length > MAX_STATES) this._states.pop ();

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
  this._runner._oldestModifiedInput = frame;
  this._runner._ackInputs.push (ackId);
  input.id = this._inputId;

  var states = this._runner._states;

  for (var i = 0; i < states.length; ++i) {
    if (states[i].frame === frame) {
      for (var j = 0; j < states[i].inputs.length; ++j) {
        if (states[i].inputs[j].id === input.id) {
          while (i >= 0) {
            states[i].inputs[j] = input;
            i--;
          }
          return;
        }
      }
    }
  }
}

// ----------------------------------------------------------------------------

module.exports = GameRunner;

