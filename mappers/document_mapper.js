const transmogrifier = require('../lib/transmogrifier')
const nanoid = require('nanoid').customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

module.exports = {
  mapMetadata: function (dpaArticle) {
    return {
      title: dpaArticle.headline
    }
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
        id: `doc-${nanoid()}`,
        position: 'fixed',
        containers: {header: [], main: [], 'sidebar-ads-top': [], sidebar: [], 'sidebar-ads-bottom': [], footer: []}
      }, function (containerNode, node, state) {
        if (node.component.identifier === 'head') {
          containerNode.component.containers.header.push(node)
          node.nextId = undefined // since there is only one head this simple rule works
          if (!state.headerStarted) {
            containerNode.containers['header'] = node.id
            state.headerStarted = true
          }
        } else {
          containerNode.component.containers.main.push(node)
          if (!state.mainStarted) {
            containerNode.containers['main'] = node.id
            state.mainStarted = true
          }
        }
      })
      .content()

    // console.log('content', content[0].containers.header, 'main', content[0].containers.main)
    return {content, design: {name: 'living-times', version: '1.0.2'}}
  }
}
