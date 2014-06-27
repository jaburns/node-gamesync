
var game = (function () {
    "use strict";

    function getInitialState () {
        return {
            paddles: [0, 0],
            ball: {x:0, y:0, vx:0.01, vy:0.005}
        };
    }

    function stepper (inputs, state)
    {
        var ns = {
            paddles: [
                state.paddles[0] + 0.05*inputs[0].paddle,
                state.paddles[1] + 0.05*inputs[1].paddle
            ],
            ball: {
                 x: state.ball.x + state.ball.vx,
                 y: state.ball.y + state.ball.vy,
                vx: state.ball.vx,
                vy: state.ball.vy
            }
        };

        if (ns.ball.x < -1) ns.ball.vx =  Math.abs (ns.ball.vx);
        if (ns.ball.x >  1) ns.ball.vx = -Math.abs (ns.ball.vx);
        if (ns.ball.y < -1) ns.ball.vy =  Math.abs (ns.ball.vy);
        if (ns.ball.y >  1) ns.ball.vy = -Math.abs (ns.ball.vy);

        return ns;
    }

    return {
        init: getInitialState,
        step: stepper,
        dt: 33
    };

})();
