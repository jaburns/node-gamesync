'use strict';

var FrameStack = require('./framestack');
var json = require('../shared/json');

function GameRunner (game, lag) {
    this._game = game;
    this._lag = typeof lag === 'number' ? lag : 0;

    this._frameStack = new FrameStack (game);

    this._clientSockets = [];
    this._stepInterval = -1;
}

GameRunner.prototype.removeClientSocket = function (socket) {
    var index = this._clientSockets.indexOf (socket);
    if (index < 0) return;

    this._clientSockets.splice (index, 1);
    this._frameStack.removeInput (socket.id);

    if (this._clientSockets.length < 1) {
        clearInterval (this._stepInterval);
        this._stepInterval = -1;
    }
}

GameRunner.prototype.addClientSocket = function (socket) {
    if (this._clientSockets.length >= this._game.players) return null;
    if (this._clientSockets.indexOf (socket) >= 0) return null;
    this._clientSockets.push (socket);

    this._frameStack.pushInput (this._game.defaultInput, socket.id);

    if (this._stepInterval < 0) {
        this._stepInterval = setInterval (this._step.bind(this), this._game.dt);
    }

    // TODO Check if we can just use the socket id on the client instead of passing it in a message.
    socket.json.send ({'notifyInputId': socket.id});

    return {
        acceptInput: function (time, input) {
            this._frameStack.input (time, socket.id, input);
        }.bind (this)
    };
}

GameRunner.prototype._step = function () {
    var newState = this._frameStack.step ();
    if (! newState) return;

    if (this._lag) {
        setTimeout (this._sendState.bind (this, json.clone (newState)), this._lag);
    } else {
        this._sendState (newState);
    }
}

GameRunner.prototype._sendState = function (state) {
    for (var i = 0; i < this._clientSockets.length; ++i) {
        this._clientSockets[i].json.volatile.send (state);
    }
}

module.exports = GameRunner;

