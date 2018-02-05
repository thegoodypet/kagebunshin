var gm = require('gm').subClass({imageMagick: true});

module.exports.resize = (inputImageBuffer, width, callback) => {
  // callback is a function with err and buffer as arguments
  gm(inputImageBuffer)
  .size(function (err, size) {
    if (err) callback(err)

    this.resize(width, size.height / size.width * width) // maintain aspect ratio
    .toBuffer(callback)
  });
}