(function(){
'use strict';


var shared = {
    stepPlayer: function(p,input) {
        p.x += input['37'] ? -10 : 0;
        p.y += input['38'] ? -10 : 0;
        p.x += input['39'] ?  10 : 0;
        p.y += input['40'] ?  10 : 0;
    }
}

if (typeof module !== 'undefined') {
    module.exports = shared;
} else {
    window.shared = shared;
}

})();
