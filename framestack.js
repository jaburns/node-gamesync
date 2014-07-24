;(function(){
'use strict';

var MAX_FRAMES = 100;

function jsonClone (obj) {
  return JSON.parse (JSON.stringify (obj));
}

/**
 * This structure represents a single frame of gameplay.
 *
 * this.state -> A user-defined State object representing the state of the game
 *               this frame.
 * this.inputs -> A hash of user-defined Input objects keyed by player ID.
 *                The inputs in frame N are used to compute frame N+1.
 * this.time -> An integer incremented by one every game step.
 */
function Frame (state, inputs, time) {
  this.state = state;
  this.inputs = inputs;
  this.time = time;
}

/**
 */
Frame.prototype.clone = function () {
  return new Frame (
    jsonClone (this.state),
    jsonClone (this.inputs),
    this.time
  );
}

/**
 * This object manages a series of Frame objects, allowing inputs to happen
 * at some point in the past, and recalculating the results of the game
 * up to whatever the current time is.
 *
 * this._game -> ...
 * this._oldestChange -> ...
 * this._frames -> ...
 */
function FrameStack (game) {
  this._game = game;
  this._oldestChange = -1;
  this._frames = [new Frame (game.init(), {}, 0)];

  this.currentFrame = this._frames[0].clone();
}

/**
 */
FrameStack.prototype.input = function (time, id, input) {
  this._oldestChange = time;

  // Make the input adjustment at the appropriate time and propagate it.
  for (var i = 0; i < this._frames.length; ++i) {
    if (this._frames[i].time === time) {
      while (i >= 0) {
        states[i].inputs[id] = input;
        i--;
      }
      break;
    }
  }
}

/**
 * Compounds the input adjustments that have happened since the previous call
 * to 'step', and then steps the game forwards by a single frame.
 */
FrameStack.prototype.step = function () {
  // Resimulate the game starting at the oldest input change.
  if (this._oldestChange >= 0) {
    for (var i = 0; i < this._frames.length; ++i) {
      if (this._frames[i].time === this._oldestChange) break;
    }
    while (i > 0) {
      this._frames[i-1] = new Frame (
        this._game.step (this._frames[i].inputs, jsonClone (this._frames[i].state)),
        this._frames[i-1].inputs,
        this._frames[i].time + 1
      );
      i--;
    }
    this._oldestChange = -1;
  }

  // Simulate the next frame, cloning the previous input state.
  this._frames.unshift (new Frame (
    this._game.step (this._frames[0].inputs, jsonClone (this._frames[0].state)),
    jsonClone (this._frames[0].inputs),
    this._frames[0].time + 1
  ));

  this.currentFrame = this._frames[0].clone();

  if (this._frames.length > MAX_FRAMES) {
    this._frames.pop ();
  }
}

// Export FrameStack as node module, or just throw it on the window
// object for the client (for now until sorting out a client code plan).
if (typeof module !== 'undefined') module.exports = FrameStack;
else if (typeof window !== 'undefined') window.FrameStack = FrameStack;

})();
