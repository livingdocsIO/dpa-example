const assert = require('assert')
const map = require('../mappers/map_dpa_article_to_dpa_design')
const simpleArticle = require('./fixtures/simple_article.json')
const articleWithImage = require('./fixtures/article_with_image.json')
const articleWithVideo = require('./fixtures/article_with_youtube.json')
const articleWithTweet = require('./fixtures/article_with_twitter_embed.json')
const articleWithTable = require('./fixtures/aritcle_with_table.json')

describe('Map DPA article to DPA Design:', function () {
  it('maps a simple article with no images', function () {
    const liArticle = map(simpleArticle, [])
    assert.equal(liArticle[0].identifier, 'header')
    assert.deepEqual(liArticle[0].content, {
      dachzeile: 'Start der Spielemesse Gamescom',
      headline: 'Scheuer kündigt finale Phase für Games-Förderung an',
      subhead: 'a subhead',
      byline: 'Köln (dpa)',
      dateline: '2020',
      creditline: 'dpa'
    })
    assert.equal(liArticle[1].identifier, 'paragraph')
    assert.equal(liArticle[2].identifier, 'paragraph')
    assert.equal(liArticle.length, 3)
  })

  it('maps an article with an image and a subtitle', function () {
    const image = {
      image: {
        url: 'https://i.pinimg.com/564x/18/35/14/183514af52487733fd7e04030f7be46f.jpg'
      },
      caption: 'foo',
      source: 'bar'
    }
    const liArticle = map(articleWithImage, [image])
    assert.equal(liArticle[0].identifier, 'header')
    assert.equal(liArticle[1].identifier, 'paragraph')
    assert.equal(liArticle[2].identifier, 'image')
    assert.deepEqual(liArticle[2].content, {
      image: {url: 'https://i.pinimg.com/564x/18/35/14/183514af52487733fd7e04030f7be46f.jpg'},
      caption: 'foo',
      source: 'bar'
    })
    assert.equal(liArticle[3].identifier, 'subtitle')
    assert.equal(liArticle[4].identifier, 'paragraph')
    assert.equal(liArticle.length, 5)
  })

  it('maps an article with an embedded youtube video', function () {
    const liArticle = map(articleWithVideo, [])
    assert.equal(liArticle.length, 5)
    assert.equal(liArticle[3].identifier, 'iframe')
    assert.equal(liArticle[3].content.iframe.includes('fyWS-sZWxdc'), true)
  })

  it('maps an article with an embedded twitter', function () {
    const liArticle = map(articleWithTweet, [])
    assert.equal(liArticle.length, 5)
    assert.equal(liArticle[3].identifier, 'tweet')
    assert.equal(liArticle[3].content.tweet.includes('845235807866769409'), true)
  })

  it('maps an article with a table', function () {
    const liArticle = map(articleWithTable, [])
    assert.equal(liArticle.length, 5)
    assert.equal(liArticle[3].identifier, 'free-html')
  })
})
