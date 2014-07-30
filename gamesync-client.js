function runGame (game, render, getInput) {
  'use strict';

  var socket = io.connect (document.URL);

  var inputId = null;
  var predictionFrame = null;
  var lastInputAckId = null;
  var lastNewInput = null;

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

      if (lastInputAckId && data.ackInputs
      && data.ackInputs.indexOf (lastInputAckId) >= 0) {
        predictionFrame = null;
        lastInputAckId = null;
        lastNewInput = null;
      }

      if (predictionFrame) {
        render (predictionFrame);
      } else {
        render (data.state);
      }

      var readInput = getInput ();

      if (readInput) {
        lastNewInput = readInput;
        lastInputAckId = Math.random().toString().substr(2);

        socket.json.send ({
          ackId: lastInputAckId,
          input: lastNewInput,
          time: data.time
        });
      }

      if (readInput || predictionFrame) {
        data.inputs[inputId] = lastNewInput;
        predictionFrame = game.step (data.inputs, predictionFrame ? predictionFrame : data.state);
      }
    });
  });
}

