'use strict';

var json = {
  clone: function (a) {
    return JSON.parse (JSON.stringify (a));
  },

  equal: function (a,b) {
    return JSON.stringify (a) === JSON.stringify (b);
  },

  lerp: function (a, b, t) {
    if (t < 0) return a;
    if (t > 1) return b;
    var ret = {};
    for (var k in a) {
      if (typeof b[k] === 'undefined') continue;
      if (typeof a[k] === 'number' && typeof b[k] === 'number') {
        ret[k] = a[k] + t * (b[k] - a[k]);
      } else if (typeof a[k] === 'object' && typeof b[k] === 'object') {
        ret[k] = json.lerp (a[k], b[k], t);
      } else {
        ret[k] = a[k];
      }
    }
    return ret;
  },

  diff: function (a,b) {
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
        if (!json.equal (a[k], b[k])) {
          ret['*'+k] = json.diff (a[k],b[k]);
        }
      }
      else if (a[k] !== b[k]) {
        ret['+'+k] = b[k];
      }
    }
    return ret;
  },

  applyDiff: function (a,diff) {
    var ret = json.clone(a);
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
          ret[k] = json.applyDiff (a[k], diff[k0]);
          break;
      }
    }
    return ret;
  }
};

module.exports = json;
