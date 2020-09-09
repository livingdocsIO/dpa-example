const transmogrifier = require('../lib/transmogrifier')
const assert = require('assert')

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

  describe('wrap:', function () {
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
          position: 'fixed',
          containers: {header: [], main: [], 'sidebar-ads-top': [], sidebar: [], 'sidebar-ads-bottom': [], footer: []}
        }, [
          {identifier: 'header', target: 'header', repeat: 'once'},
          {identifier: 'header', target: 'main', repeat: 'all'},
          {identifier: 'paragraph', target: 'main', repeat: 'all'},
          {identifier: 'image', target: 'main', repeat: 'all'}
        ])
        .content()

      assert.equal(output.length, 1)
      assert.equal(output[0].containers['header'].length, 1)
      assert.equal(output[0].containers['main'].length, 2)
      assert.equal(output[0].containers['header'][0].identifier, 'header')
      assert.equal(output[0].containers['main'][0].identifier, 'paragraph')
      assert.equal(output[0].containers['main'][1].identifier, 'image')
    })

    it('skips a component that has no mapping', function () {
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
        position: 'fixed',
        containers: {header: [], main: [], 'sidebar-ads-top': [], sidebar: [], 'sidebar-ads-bottom': [], footer: []}
      }, [
        {identifier: 'header', target: 'header', repeat: 'once'},
        {identifier: 'header', target: 'main', repeat: 'all'},
        {identifier: 'paragraph', target: 'main', repeat: 'all'}
      ])
      .content()

      assert.equal(output.length, 1)
      assert.equal(output[0].containers['header'].length, 1)
      assert.equal(output[0].containers['main'].length, 1)
    })

    it('applies a repeat rule', function () {
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
      }, {
        identifier: 'paragraph',
        id: 'efg123',
        content: {text: 'foo'}
      },
      {
        identifier: 'paragraph',
        id: 'fgh123',
        content: {text: 'foo'}
      }]

      const output = transmogrifier(input)
      .wrap({
        identifier: 'article-container',
        position: 'fixed',
        containers: {header: [], main: [], 'sidebar-ads-top': [], sidebar: [], 'sidebar-ads-bottom': [], footer: []}
      }, [
        {identifier: 'header', target: 'header', repeat: 'once'},
        {identifier: 'paragraph', target: 'header', repeat: 'once'},
        {identifier: 'paragraph', target: 'main', repeat: 'all'},
        {identifier: 'image', target: 'main', repeat: 'all'}
      ])
      .content()

      assert.equal(output.length, 1)
      assert.equal(output[0].containers['header'].length, 2)
      assert.equal(output[0].containers['main'].length, 3)
    })
  })
})
