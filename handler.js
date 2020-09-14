const _ = require('lodash')
const {getArticlesFromBucket} = require('./lib/s3_helpers')
const {getImages} = require('./lib/dpa_parsers')
const {importImages, getImageImport, importArticles} = require('./lib/livingdocs_connector')
const {storeImageImportWithDPAArticles, failImport, getDPAArticlesImport, succeedImport, storeDocumentImport} = require('./lib/db_connector')

module.exports = {
  documentsImported: async (data) => {
    if (!data.body) {
      console.error('webhook response for document import has no body')
      return
    }
    try {
      const body = JSON.parse(data.body)
      if (!body.source === 'livingdocs-document-import') {
        console.error(`webhook called from unknown source: ${data.body.source}`)
        return
      }
      const {id, state, overview} = body
      if (state !== 'success') {
        const error = `Document import with batch id "${id}" was not successful: ${state}`
        console.error(error)
        return failImport(id, error)
      }
      // at least one of the documents failed -> we choose to set failed then
      const failedCount = _.get(overview, 'details.failed', 0)
      if (failedCount > 0) {
        const error = `Document import with batch id "${id}" had ${failedCount} failed documents. Aborting...`
        console.error(error)
        return failImport(id, error)
      }
      // otherwise succeed
      succeedImport(id)
      console.log(`Document import with id "${id}" succeeded.`)
    } catch (e) {
      console.error(e)
    }
  },
  imagesImported: async (data) => {
    if (!data.body) {
      console.error('webhook response for image import has no body')
      return
    }
    try {
      const body = JSON.parse(data.body)
      if (!body.source === 'livingdocs-image-import') {
        console.error(`webhook called from unknown source: ${data.body.source}`)
        return
      }
      const {id, state, overview} = body
      // job failed (internal error)
      if (state !== 'success') {
        const error = `Image import with batch id "${id}" was not successful: ${state}`
        console.error(error)
        return failImport(id, error)
      }
      // at least one of the images failed -> we choose to abort then
      const failedCount = _.get(overview, 'details.failed', 0)
      if (failedCount > 0) {
        const error = `Image import with batch id "${id}" had ${failedCount} failed images. Aborting...`
        console.error(error)
        return failImport(id, error)
      }

      // get the image batch result from Livingdocs
      const imageImport = await getImageImport(id)

      // check if state is consistent (success)
      if (imageImport.state !== 'success') {
        const error = `Inconsistent result after fetching batch id: ${id}, status: ${imageImport.state}, expected: success`
        console.error(error)
        return failImport(id, error)
      }
      // check that all image states are consistent (no failed)
      const livingdocsImages = imageImport.images
      if (_.find(livingdocsImages, i => i.status === 'failed')) {
        const error = `Inconsistent result after fetching batch id: ${id}, ${i}`
        console.error(error)
        return failImport(error)
      }
      // nothing wrong with the image import, succeed it
      await succeedImport(id)

      const articles = await getDPAArticlesImport(id)
      const batchId = await importArticles(articles, livingdocsImages)
      return storeDocumentImport(batchId)
    } catch (e) {
      console.error(e)
    }
  },
  // Entry point
  s3hook: async (event, context) => {
    const articles = await getArticlesFromBucket(event.Records)
    const images = getImages(articles)
    const batchId = await importImages(images)
    return storeImageImportWithDPAArticles(batchId, articles)
  }
}
