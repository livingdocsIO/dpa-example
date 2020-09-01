const AWS = require('aws-sdk')
const _ = require('lodash')
const axios = require('axios')
var dynamodb = require('serverless-dynamodb-client')

module.exports = {
  documentsImported: async (data) => {
    console.log('documents imported', data)
  },
  imagesImported: async (data) => {
    if (!data.body) {
      console.error('webhook response for image import has no body')
      return
    }
    try {
      const body = JSON.parse(data.body)
      console.log('body', body)
      if (!body.source === 'livingdocs-image-import') {
        console.error(`webhook called from unknown source: ${data.body.source}`)
        return
      }
      const {id, state, overview} = body
      // job failed (internal error)
      if (state !== 'success') {
        console.error(`Image import with batch id "${id}" was not successful: ${state}`)
        return
      }
      // at least one of the images failed -> we choose to abort then
      const failedCount = _.get(overview, 'details.failed', 0)
      if (failedCount > 0) {
        console.error(`Image import with batch id "${id}" had ${failedCount} failed images. Aborting...`)
        return
      }
      // get the image batch result from Livingdocs
      const config = {
        headers: {Authorization: `Bearer ${process.env.LI_TOKEN}`}
      }
      const res = await axios.get(`${process.env.LI_HOST}/api/v1/import/images/status?id=${id}`, config)
      // check that state is consistent (success)
      if (res.data.state !== 'success') {
        console.error(`Inconsistent result after fetching batch id: ${id}, status: ${res.data.state}, expected: success`)
        return
      }
      // check that all image states are consistent (no failed)
      const livingdocsImages = res.data.images
      if (_.find(livingdocsImages, i => i.status === 'failed')) {
        console.error(`Inconsistent result after fetching batch id: ${id}, `)
      }
      console.log('livingdocsImages', livingdocsImages)
      
      /*
        This is a bit unfortunate: since the webhook can be called before the entry is stored in dynamo db
        we have to give dynamo db some time here.
        I wonder how other clients are doing this...
      */
      setTimeout(async function () {
        const client = dynamodb.doc
        // get the associated DPA records
        var params = {
          TableName: 'ImportsTable',
          Key: {
            batchId: id
          }
        }
        client.get(params, async function (err, data) {
          if (err) console.error(err)
          console.log('found db record', data)
          const documentData = {
            systemName: 'dpa-import-example',
            // TODO for deployed versions change the host part
            webhook: 'http://localhost:3000/dev/documents-imported',
            documents: _.map(data.Item.dpaArticles, (a) => {
              const image = _.find(livingdocsImages, (i) => {
                return _.find(a.associations, (ass) => {
                  if (i.externalId === ass.urn) return true
                  return false
                })
              })
              console.log('matched image', image)

              return {
                id: a.entry_id,
                title: a.kicker,
                contentType: 'regular',
                checksum: `${a.entry_id}--${a.version}`,
                livingdoc: {
                  content: [{
                    identifier: 'title',
                    content: {
                      title: a.headline
                    }
                  }, {
                    identifier: 'image',
                    content: { // TODO caption, etc.
                      image: image.image
                    }
                  }],
                  design: {
                    name: 'p:3:4',
                    version: '23.0.0'
                  }
                },
                metadata: {
                  title: a.headline
                }
              }
            })
          }
          const documentBatchId = 
            await axios.post(`${process.env.LI_HOST}/api/v1/import/documents`, documentData, config)
          console.log('documentBatchId', documentBatchId)
        })
      }, 1000)
    } catch (e) {
      console.error(e)
    }
  },
  s3hook: async (event, context) => {
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
      // TODO for deployed versions change the host part
      webhook: 'http://localhost:3000/dev/images-imported',
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

    const client = dynamodb.doc
    const params = {
      TableName: 'ImportsTable',
      Item: {
        batchId: batchId,
        dpaArticles: articles 
      }
    }
    // TODO is there an async form of this?
    client.put(params, function (err, data) {
      if (err) console.error(err)
      else {
        console.log('import batch id stored', data)
      }
    })

  }
}