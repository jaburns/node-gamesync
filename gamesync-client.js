function runGame (game, render, getInput) {
  'use strict';

  var socket = io.connect (document.URL);
  var inputId = null;
  var localInputs = [];

  socket.on ('connect', function () {
    socket.on ('message', function (data) {
      if (data.error) {
        alert (data.error);
        return;
      }
      if (data.notifyInputId) {
        inputId = data.notifyInputId;
        return;
      }

      var state = data.pastState;
      var time = data.time;

      while (data.knownInputs.length > 0) {
        state = game.step (data.knownInputs.pop(), state);
        time++;
      }

      render (state);

      var readInput = getInput ();

      if (readInput) {
        // TODO keep track of local inputs and integrate in to data coming back from server.
        socket.json.send ({
          input: readInput,
          time: time
        });
      }
    });
  });
}

