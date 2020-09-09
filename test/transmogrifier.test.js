const transmogrifier = require('../lib/transmogrifier')
const assert = require('assert')
const nanoid = require('nanoid').customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

describe('Transmogrifier:', function () {
  it('transforms a component', function () {
    const input = [{
      identifier: 'header',
      id: 'abc123',
      content: {
        dachzeile: 'foo',
        headline: 'bar',
        subhead: 'foo bar',
        byline: 'me',
        dateline: 'today',
        creditline: 'livingdocs'
      }
    }]

    const output = transmogrifier(input)
      .transform('header', (component) => {
        component.content = {title: component.content.headline}
        return component
      })
      .content()

    assert.deepEqual(output[0], {
      identifier: 'header',
      id: 'abc123',
      content: {
        title: 'bar'
      }
    })

  })

  it('removes a component', function () {
    const input = [{
      identifier: 'header',
      id: 'abc123',
      content: {
        dachzeile: 'foo',
        headline: 'bar',
        subhead: 'foo bar',
        byline: 'me',
        dateline: 'today',
        creditline: 'livingdocs'
      }
    }]

    const output = transmogrifier(input)
      .remove('header')
      .content()
    assert.equal(output.length, 0)
  })

  it('renames a component', function () {
    const input = [{
      identifier: 'header',
      id: 'abc123',
      content: {
        dachzeile: 'foo',
        headline: 'bar',
        subhead: 'foo bar',
        byline: 'me',
        dateline: 'today',
        creditline: 'livingdocs'
      }
    }]

    const output = transmogrifier(input)
      .rename('header', 'head')
      .content()
    assert.equal(output[0].identifier, 'head')
  })

  it('wraps a flat document into containers', function () {
    const input = [{
      identifier: 'header',
      id: 'abc123',
      content: {headline: 'bar'}
    }, {
      identifier: 'paragraph',
      id: 'bcd123',
      content: {text: 'foo'}
    }, {
      identifier: 'image',
      id: 'cde123',
      content: {image: {url: ''}}
    }]

    const output = transmogrifier(input)
      .wrap({
        identifier: 'article-container',
        id: `doc-${nanoid()}`,
        position: 'fixed',
        containers: {header: [], main: [], 'sidebar-ads-top': [], sidebar: [], 'sidebar-ads-bottom': [], footer: []}
      }, function (containerNode, node, state) {
        if (node.component.identifier === 'header') {
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

    assert.equal(output.length, 1)
    assert.equal(output[0].containers['header'].length, 1)
    assert.equal(output[0].containers['main'].length, 2)
  })
})
