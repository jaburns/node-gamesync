'use strict';

var util = {
  jsonClone: function (a) {
    return JSON.parse (JSON.stringify (a));
  },

  jsonEqual: function (a,b) {
    return JSON.stringify (a) === JSON.stringify (b);
  },

  jsonLerp: function (a, b, t) {
    if (t < 0) return a;
    if (t > 1) return b;
    var ret = {};
    for (var k in a) {
      if (typeof b[k] === 'undefined') continue;
      if (typeof a[k] === 'number' && typeof b[k] === 'number') {
        ret[k] = a[k] + t * (b[k] - a[k]);
      } else if (typeof a[k] === 'object' && typeof b[k] === 'object') {
        ret[k] = util.jsonLerp (a[k], b[k], t);
      }
    }
    return ret;
  },

  jsonDiff: function (a,b) {
    var ret = {};
    var keys = Object.keys(a).concat(Object.keys(b));
    for (var i = 0; i < keys.length; ++i) {
      var k = keys[i];
      if (typeof a[k] === 'undefined') {
        ret['+'+k] = b[k];
      }
      else if (typeof b[k] === 'undefined') {
        ret['-'+k] = 0;
      }
      else if (typeof a[k] === 'object' && typeof b[k] === 'object') {
        if (!util.jsonEqual (a[k], b[k])) {
          ret['*'+k] = util.jsonDiff (a[k],b[k]);
        }
      }
      else if (a[k] !== b[k]) {
        ret['+'+k] = b[k];
      }
    }
    return ret;
  },

  jsonApplyDiff: function (a,diff) {
    var ret = util.jsonClone(a);
    for (var k0 in diff) {
      var pre = k0[0];
      var k = k0.substr(1);
      switch (pre) {
        case '+':
          ret[k] = diff[k0];
          break;
        case '-':
          if (typeof ret[k] !== 'undefined') delete ret[k];
          break;
        case '*':
          ret[k] = util.jsonApplyDiff (a[k], diff[k0]);
          break;
      }
    }
    return ret;
  }
};

module.exports = util;
