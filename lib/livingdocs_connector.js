const _ = require('lodash')
const axios = require('axios')
const {mapMetadata} = require('../mappers/image_mapper')
const documentMapper = require('../mappers/document_mapper')
const mapToAbstractLivingdoc = require('../mappers/map_dpa_article_to_dpa_design')

module.exports = {
  importArticles: async function (articles, livingdocsImages) {
    const config = {
      headers: {Authorization: `Bearer ${process.env.LI_TOKEN}`}
    }
    const documentData = {
      systemName: 'dpa-import-example',
      // TODO for deployed versions change the host part
      webhook: 'http://localhost:3000/dev/documents-imported',
      documents: _.map(articles, (a) => {
        const images = _.reduce(livingdocsImages, (res, i, key) => {
          const association = _.find(a.associations, (ass) => {
            return i.externalId === ass.urn
          })
          if (association) res.push({...i, caption: association.caption, source: association.creditline})
          return res
        }, [])

        const liArticle = mapToAbstractLivingdoc(a, images)

        return {
          id: a.entry_id,
          title: a.kicker,
          contentType: 'regular',
          checksum: `${a.entry_id}--${a.version}`,
          livingdoc: documentMapper.mapDocument(liArticle),
          metadata: documentMapper.mapMetadata(a)
        }
      })
    }
    const res =
      await axios.post(`${process.env.LI_HOST}/api/v1/import/documents`, documentData, config)
    return res.data.id
  },
  getImageImport: async function (id) {
    const config = {
      headers: {Authorization: `Bearer ${process.env.LI_TOKEN}`}
    }
    const res = await axios.get(`${process.env.LI_HOST}/api/v1/import/images/status?id=${id}`, config)
    return {state: res.data.state, images: res.data.images}
  },
  importImages: async function (images) {
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
          metadata: mapMetadata(i)
        }
      })
    }
    const res = await axios.post(`${process.env.LI_HOST}/api/v1/import/images`, data, config)
    return res.data.id
  }
}
