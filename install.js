'use strict';

var fs = require('fs');
var browserify = require('browserify');

browserify('./client/main').bundle(function(err,buf) {
  if (err) {
    console.error(err);
    return;
  }

  fs.writeFileSync('client.bundle.js', buf.toString());
});
