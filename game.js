
var game = (function () {
    "use strict";

    function getInitialState () {
        return {
            paddles: [0, 0],
            ball: {x:0, y:0, vx:0.01, vy:0.005}
        };
    }

    function stepper (input, state) {
        return {
            paddles: [
                state.paddles[0] + 0.05*input.players[0],
                state.paddles[1] + 0.05*input.players[1]
            ],
            ball: {
                 x: state.ball.x + state.ball.vx,
                 y: state.ball.y + state.ball.vy,
                vx: state.ball.vx,
                vy: state.ball.vy
            }
        };
    }

    return {
        init: getInitialState,
        step: stepper,
        dt: 34
    };

})();
