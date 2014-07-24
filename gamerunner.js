'use strict';

var MAX_frames = 100;

function Frame (state, inputs, frame) {
  this.state = state;
  this.inputs = inputs;
  this.frame = frame;
}

Frame.prototype.clone = function () {
  return new Frame (
    jsonClone (this.state),
    jsonClone (this.inputs),
    this.frame
  );
}

// ----------------------------------------------------------------------------

function GameRunner (game, lag) {
  this._game = game;
  this._lag = typeof lag === 'number' ? lag : 0;

  this._frames = [new Frame (game.init(), [], 0)];

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
  this._frames[0].inputs.push (firstInput);

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
  if (this._oldestModifiedInput >= 0) {
    for (var i = 0; i < this._frames.length; ++i) {
      if (this._frames[i].frame === this._oldestModifiedInput) break;
    }
    while (i > 0) {
      this._frames[i-1] = new Frame (
        this._game.step (this._frames[i].inputs, jsonClone (this._frames[i].state)),
        this._frames[i-1].inputs,
        this._frames[i].frame + 1
      );
      i--;
    }
    this._oldestModifiedInput = -1;
  }

  this._frames.unshift (new Frame (
    this._game.step (this._frames[0].inputs, jsonClone (this._frames[0].state)),
    this._frames[0].inputs.slice(),
    this._frames[0].frame + 1
  ));
  if (this._frames.length > MAX_frames) this._frames.pop ();

  var newState = this._frames[0];

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
  this._runner._oldestModifiedInput = frame;
  this._runner._ackInputs.push (ackId);
  input.id = this._inputId;

  var frames = this._runner._frames;

  for (var i = 0; i < frames.length; ++i) {
    if (frames[i].frame === frame) {
      for (var j = 0; j < frames[i].inputs.length; ++j) {
        if (frames[i].inputs[j].id === input.id) {
          while (i >= 0) {
            frames[i].inputs[j] = input;
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

