const _ = require('lodash')

module.exports = {
  getImages: function (articles) {
    return _.reduce(articles, (arr, article) => {
      for (const as of article.associations) {
        if (as.type === 'image') arr.push(as)
      }
      return arr
    }, [])
  }
}
