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
        var frameInputs = data.knownInputs.pop();
        // TODO if we have some known local inputs to add to this frame then do so here
        frame.state = game.step (frameInputs, frame.state);
      }

      render (frame.state);

      var readInput = getInput ();

      if (readInput) {
        // TODO keep track of the inputs that are happening locally so we can integrate them next frame
        socket.json.send ({
          input: readInput,
          time: frame.time
        });
      }
    });
  });
}

