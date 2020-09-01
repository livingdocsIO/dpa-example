module.exports = {
  mapMetadata: function (dpaArticle) {
    return {
      title: dpaArticle.headline
    }
  },
  mapDocument: function (dpaArticle, image) {
    return {
      content: [{
        identifier: 'title',
        content: {
          title: dpaArticle.headline
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
    }
  }
}
