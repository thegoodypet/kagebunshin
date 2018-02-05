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
  const srcBucketName = srcS3.bucket.name
  const srcKey = srcS3.object.key

  const srcParams = {
    Bucket: srcBucketName,
    Key: srcKey
  }

  s3.getObject(srcParams)
  .promise()
  .then(function(data) {

    const width = 100

    resize(data.Body, width, function(err, buffer) {
      if (err) return callback(null, handleS3Error(err));

      const dstParams = {
        Bucket: dstBucket,
        Key: srcKey,
        Body: buffer,
        StorageClass: "REDUCED_REDUNDANCY",
        ACL: "public-read",
        ContentType: data.ContentType
      }

      s3.upload(dstParams).promise().then(function(data) {

        const response = {
          statusCode: 200,
          body: JSON.stringify({
            message: data,
          }),
        };

        callback(null, response);
      }).catch(function(err) {
        callback(null, handleS3Error(err))
      })
    })
  }).catch(function(err) {
    callback(null, handleS3Error(err))
  })

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
