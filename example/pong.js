var game = (function () {
    'use strict';

    // paddle 0 is top, 1 is bottom
    // paddle y positions are -0.9 and 0.9
    // paddle widths are 0.1
    //
    function constrainPaddles (paddles) {
        for (var i = 0; i < paddles.length; ++i) {
            if (paddles[i] < -0.9) paddles[i] = -0.9;
            if (paddles[i] >  0.9) paddles[i] =  0.9;
        }
    }

    return {
        dt: 33,
        players: 2,

        initialState: function(seed) {
            return {
                paddles: [0, 0],
                score: [0, 0],
                ball: {x:0, y:0, vx:0.03, vy:0.025}
            };
        },

        defaultInput: {
            paddle: 0
        },

        step: function (inputHash, state) {
            var inputs = [];
            for (var key in inputHash) {
                inputs.push (inputHash[key]);
            }

            if (inputs.length < 2) return state;

            var ns = {
                paddles: [
                    state.paddles[0] + 0.05*inputs[0].paddle,
                    state.paddles[1] + 0.05*inputs[1].paddle
                ],
                score: state.score,
                ball: {
                    x: state.ball.x + state.ball.vx,
                    y: state.ball.y + state.ball.vy,
                    vx: state.ball.vx,
                    vy: state.ball.vy
                }
            };

            if (ns.ball.x < -1) ns.ball.vx =  Math.abs (ns.ball.vx);
            if (ns.ball.x >  1) ns.ball.vx = -Math.abs (ns.ball.vx);

            constrainPaddles (ns.paddles);

            var scored = false;
            if (ns.ball.y < -1) {
                ns.score[0]++;
                scored = true;
            }
            else if (ns.ball.y > 1) {
                ns.score[1]++;
                scored = true;
            }
            if (scored) {
                ns.ball.x = ns.ball.y = 0;
            }

            if (ns.ball.vy > 0 && state.ball.y < 0.9 && ns.ball.y >= 0.9) {
                var dx = ns.ball.x - ns.paddles[1];
                if (Math.abs (dx) < 0.1) {
                    ns.ball.vx = 0.05*(dx/0.1);
                    ns.ball.vy = -Math.abs (ns.ball.vy);
                }
            }
            else if (ns.ball.vy < 0 && state.ball.y > -0.9 && ns.ball.y <= -0.9) {
                var dx = ns.ball.x - ns.paddles[0];
                if (Math.abs (dx) < 0.1) {
                    ns.ball.vx = 0.05*(dx/0.1);
                    ns.ball.vy = Math.abs (ns.ball.vy);
                }
            }

            return ns;
        }
    };
})();

if (typeof module !== 'undefined') module.exports = game;

