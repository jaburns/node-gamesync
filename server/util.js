'use strict'

module.exports = {
  jsonClone: function (obj) {
    return JSON.parse (JSON.stringify (obj));
  }
}
