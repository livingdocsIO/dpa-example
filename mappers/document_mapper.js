const transmogrifier = require('../lib/transmogrifier')

module.exports = {
  mapMetadata: function (dpaArticle) {
    return {
      title: dpaArticle.headline
    }
  },
  mapContentType: function (dpaArticle) {
    return 'regular'
  },
  mapDocument: function (abstractArticle) {
    const content = transmogrifier(abstractArticle)
      .rename('header', 'head')
      .transform('head', (component) => {
        const flag = component.content.dachzeile || ''
        const title = component.content.headline || ''
        const text = component.content.subhead || ''
        const author = component.content.byline || component.content.creditline || ''
        const date = component.content.dateline || ''
        component.content = {flag, title, text, author, date}
        return component
      })
      .transform('image', (component) => {
        delete component.content.source
        return component
      })
      .wrap({
        identifier: 'article-container',
        position: 'fixed',
        containers: {header: [], main: [], 'sidebar-ads-top': [], sidebar: [], 'sidebar-ads-bottom': [], footer: []}
      }, [
        {identifier: 'head', target: 'header', repeat: 'once'},
        {identifier: 'head', target: 'main', repeat: 'all'},
        {identifier: 'paragraph', target: 'main', repeat: 'all'},
        {identifier: 'image', target: 'main', repeat: 'all'},
        {identifier: 'subtitle', target: 'main', repeat: 'all'},
        {identifier: 'free-html', target: 'main', repeat: 'all'},
        {identifier: 'iframe', target: 'main', repeat: 'all'},
        {identifier: 'tweet', target: 'main', repeat: 'all'}
      ])
      .content()

    return {content, design: {name: 'living-times', version: '1.0.2'}}
  }
}
