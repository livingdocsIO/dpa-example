const AWS = require('aws-sdk')
const _ = require('lodash')
const axios = require('axios')

module.exports.s3hook = async (event, context) => {
  const getters = _.map(event.Records, (record) => {
    const bucket = record.s3.bucket.name
    const key = record.s3.object.key

    async function getArticle () {
      const S3 = new AWS.S3({
        s3ForcePathStyle: true,
        endpoint: new AWS.Endpoint('http://localhost:4569')
      })
      const data = await S3.getObject({ Bucket: bucket, Key: key }).promise()
      const article = JSON.parse(data.Body.toString('utf-8'))
      return article
    }

    return getArticle()
  })

  const articles = await Promise.all(getters)
  const images = _.reduce(articles, (arr, article) => {
    for (const as of article.associations) {
      if (as.type === 'image') arr.push(as)
    }
    return arr
  },[])
  

  const config = {
    headers: {Authorization: `Bearer ${process.env.LI_TOKEN}`}
  }
  const data = {
    systemName: 'dpa-import-example',
    images: _.map(images, (i) => {
      return {
        url: i.renditions[0].url,
        id: i.urn,
        fileName: i.headline,
        metadata: {
          title: i.headline,
          caption: i.caption,
          source: i.creditline,
          createdAt: i.version_created
        }
      }
    })
  }
  const res = await axios.post(`${process.env.LI_HOST}/api/v1/import/images`, data, config)
  const batchId = res.data.id  
  console.log('import batch id', batchId)
}