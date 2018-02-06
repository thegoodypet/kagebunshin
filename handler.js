'use strict';

var handleS3Error = require('./helpers/errors').handleS3Error
var resize = require('./helpers/resizer').resize

var AWS = require('aws-sdk');

module.exports.onUpload = (event, context, callback) => {
  var dstBucket = process.env.DST_BUCKET_NAME;

  var s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  })

  //** event.body is used for debugging in sls offline 
  //** event is a string when debugging using postman
  //** event is a JSON when triggered by an S3 event
  
  // const srcS3 = JSON.parse(event.body).Records[0].s3 // for dev in sls offline
  const srcS3 = event.Records[0].s3 // in production with S3 event as input
  const srcBucket = srcS3.bucket.name
  const srcKey = srcS3.object.key

  const srcParams = {
    Bucket: srcBucket,
    Key: srcKey
  }

  s3.getObject(srcParams)
  .promise()
  .then(function(data) {

    const widths = [320, 400, 768, 1200]

    widths.forEach(function(width) {

      resize(data.Body, width, function(err, buffer) {
        if (err) return callback(null, handleS3Error(err));

        let dstKey = srcKey.replace(".", `_${width}.`) // add dimension to name of file

        const dstParams = {
          Bucket: dstBucket,
          Key: dstKey,
          Body: buffer,
          StorageClass: "REDUCED_REDUNDANCY",
          ACL: "public-read",
          ContentType: data.ContentType
        }

        s3.upload(dstParams)
        .promise()
        .catch(function(err) {
          callback(null, handleS3Error(err))
        })
      })
    })

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully resized",
      }),
    };

    callback(null, response);
  }).catch(function(err) {
    callback(null, handleS3Error(err))
  })

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.onRRSObjectLost = (event, context, callback) => {
  
  const srcBucket = process.env.SRC_BUCKET_NAME;

  const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  })

  //** event.body is used for debugging in sls offline 
  //** event is a string when debugging using postman
  //** event is a JSON when triggered by an S3 event
  
  // const record = JSON.parse(event.body).Records[0] // for dev in sls offline
  const record = event.Records[0] // in production with S3 event as input
  const extension = key.split(".").pop()

  const width = parseInt(key.split("_").pop().split(".").shift())

  const srcKey = key.replace(/\_[0-9]+\..*$/i, `.${extension}`)

  const srcParams = {
    Bucket: srcBucket,
    Key: srcKey
  }

  s3.getObject(srcParams)
  .promise()
  .then(function(data) {
    resize(data.Body, width, function(err, buffer) {
      if (err) return callback(null, handleS3Error(err));

      const bucketName = record.s3.bucket.name
      const key = record.s3.object.key
      const dstParams = {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        StorageClass: "REDUCED_REDUNDANCY",
        ACL: "public-read",
        ContentType: data.ContentType
      }

      s3.upload(dstParams)
      .promise()
      .then(function(data) {
        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: data,
          }),
        };

        callback(null, response);
      })
      .catch(function(err) {
        callback(null, handleS3Error(err))
      })
    })
  })
  .catch(function(err) {
    callback(null, handleS3Error(err))
  })
};