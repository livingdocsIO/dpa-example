const AWS = require('aws-sdk')
const _ = require('lodash')

module.exports = {
  getArticlesFromBucket: async function (records) {
    const getters = _.map(records, (record) => {
      const bucket = record.s3.bucket.name
      const key = record.s3.object.key

      async function getArticle () {
        const S3 = new AWS.S3({
          s3ForcePathStyle: true,
          endpoint: new AWS.Endpoint(process.env.LI_IMPORT_AWS_HOST)
        })
        const data = await S3.getObject({ Bucket: bucket, Key: key }).promise()
        const article = JSON.parse(data.Body.toString('utf-8'))
        return article
      }
      return getArticle()
    })
    return Promise.all(getters)
  }
}
