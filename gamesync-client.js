function runGame (game, render, getInput) {
  'use strict';

  var socket = io.connect (document.URL);
  var inputId = null;

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

      var frame = {};
      frame.state = data.pastState;
      frame.time = data.pastTime + data.knownInputs.length;
      while (data.knownInputs.length) {
        frame.state = game.step (data.knownInputs.pop(), frame.state);
      }

      render (frame.state);

      var readInput = getInput ();

      if (readInput) {
        socket.json.send ({
          ackId: Math.random().toString().substr(2),
          input: readInput,
          time: frame.time
        });
      }
    });
  });
}

