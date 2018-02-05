var gm = require('gm').subClass({imageMagick: true});

module.exports.resize = (inputImageBuffer, width, callback) => {
  // callback is a function with err and buffer as arguments
  gm(inputImageBuffer)
  .size(function (err, size) {
    if (err) callback(err)

    this.resize(Math.min(width, size.width), size.height / size.width * Math.min(width, size.width)) // maintain aspect ratio
    .toBuffer(callback)
  });
}