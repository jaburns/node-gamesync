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

      if (data.pastState) {
        var fixState = data.pastState;
        var newTime = data.pastTime + data.knownInputs.length;
        var latestInputs = null;
        while (data.knownInputs.length) {
          latestInputs = data.knownInputs.pop();
          fixState = game.step (latestInputs, fixState);
        }
        data = {
          state: fixState,
          inputs: latestInputs,
          time: newTime
        };
      }

      render (data.state);

      var readInput = getInput ();

      if (readInput) {
        socket.json.send ({
          ackId: Math.random().toString().substr(2),
          input: readInput,
          time: data.time
        });
      }
    });
  });
}

