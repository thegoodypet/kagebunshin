var gm = require('gm').subClass({imageMagick: true});

module.exports.resize = (inputImageBuffer, width, height, callback) => {
  // callback is a function with err and buffer as arguments
  gm(inputImageBuffer)
  .resize(width, height)
  .toBuffer(callback)
}