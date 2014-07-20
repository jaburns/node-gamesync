
function runGame (game, render, getInput) {
    var socket = io.connect (document.URL);

    var inputId = null;
    var predictionFrame = null;
    var lastInputAckId = null;
    var lastNewInput = null;

    function combineInputs (all, local) {
        for (var i = 0; i < all.length ; ++i) {
            if (all[i].id === local.id) {
                all[i] = local;
                break;
            }
        }
        return all;
    }

    socket.on ("connect", function () {
        socket.on ("message", function (data) {
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
                lastNewInput.id = inputId;
                lastInputAckId = Math.random().toString().substr(2);

                socket.json.send ({
                    ackId: lastInputAckId,
                    input: lastNewInput,
                    frame: data.frame
                });

                predictionFrame = game.step (combineInputs (data.inputs, lastNewInput),
                    predictionFrame ? predictionFrame : data.state);
            }
            else if (predictionFrame) {
                predictionFrame = game.step (combineInputs (data.inputs, lastNewInput),
                    predictionFrame);
            }
        });
    });
}
