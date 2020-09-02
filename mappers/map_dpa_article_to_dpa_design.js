const cheerio = require('cheerio')
const nanoid = require('nanoid').customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

module.exports = function (dpaArticle, images) {
  const liArticle = []

  // header
  liArticle.push({
    identifier: 'header',
    id: `doc-${nanoid()}`,
    content: {
      dachzeile: dpaArticle.dachzeile,
      headline: dpaArticle.headline,
      subhead: dpaArticle.subhead,
      byline: dpaArticle.byline,
      dateline: dpaArticle.dateline,
      creditline: dpaArticle.creditline
    }
  })
  // teaser
  if (dpaArticle.teaser) {
    liArticle.push({
      identifier: 'paragraph',
      id: `doc-${nanoid()}`,
      content: {
        text: dpaArticle.teaser
      }
    })
  }
  // images
  for (const image of images) {
    liArticle.push({
      identifier: 'image',
      id: `doc-${nanoid()}`,
      content: {
        image: image.image,
        caption: image.caption,
        source: image.source
      }
    })
  }
  const $ = cheerio.load(dpaArticle.article_html)
  $('section').children().each(function (i, elm) {
    if (elm.type !== 'tag') return
    // TODO embeds (youtube, twitter)
    // TODO can those things be nested?
    switch (elm.name) {
      case 'p':
        liArticle.push({
          identifier: 'paragraph',
          id: `doc-${nanoid()}`,
          content: {
            text: $(this).text()
          }
        })
        break
      case 'h2':
        liArticle.push({
          identifier: 'subtitle',
          id: `doc-${nanoid()}`,
          content: {
            text: $(this).text()
          }
        })
        break
      case 'table':
        liArticle.push({
          identifier: 'free-html',
          id: `doc-${nanoid()}`,
          content: {
            'free-html': $(this).html()
          }
        })
        break
      default:
        console.error(`unhandled dpa html tag: ${elm.name}`)
    }
  })
  // TODO infobox and linkbox
  return liArticle
}
