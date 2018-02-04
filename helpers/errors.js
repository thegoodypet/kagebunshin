module.exports.handleS3Error = (err) => {
  return {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST'
    },
    body: JSON.stringify({
      responseMessage: err.message,
      data: err,
    }),
  }
}