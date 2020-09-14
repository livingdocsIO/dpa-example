const cheerio = require('cheerio')
const nanoid = require('nanoid').customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10)

module.exports = function (dpaArticle, images) {
  const liArticle = []

  // header
  liArticle.push({
    identifier: 'header',
    id: `doc-${nanoid()}`,
    content: {
      dachzeile: dpaArticle.kicker,
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
    switch (elm.name) {
      case 'a':
        mapATag($, elm, liArticle)
        break
      case 'p':
        mapPTag($, elm, liArticle)
        break
      case 'h2':
        mapH2Tag($, elm, liArticle)
        break
      case 'table':
        mapTableTag($, elm, liArticle)
        break
      default:
        console.error(`unhandled dpa html tag: ${elm.name}`)
    }
  })
  // Note: infobox and linkbox are ignored atm, feel free to add them with a PR
  return liArticle
}

function mapATag ($, elm, liArticle) {
  if (elm.attribs.class === 'embed externalLink') {
    const href = elm.attribs.href
    if (href.includes('youtube.com')) {
      // https://www.youtube.com/watch?v=fyWS-sZWxdc
      const id = href.match(/(.*)youtube\.com\/watch\?v=(.+)/)[2]
      liArticle.push({
        identifier: 'iframe',
        id: `doc-${nanoid()}`,
        content: {
          iframe: `<div class="responsiveContainer"
            style="position: relative; height: 0px; overflow: hidden; max-width: 100%; padding-bottom: 55%;">
              <iframe src="https://www.youtube.com/embed/${id}"
                frameborder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen=""
                style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;">
              </iframe>
            </div>`
        }
      })
    } else if (href.includes('twitter.com')) {
      console.error('twitter embed not implemented', href) // TODO we need an example, none in the docs
    } else {
      console.error(`Unknown DPA embed: ${href}. Skipping.`)
    }
  } else {
    // just wrap in a p tag
    liArticle.push({
      identifier: 'paragraph',
      id: `doc-${nanoid()}`,
      content: {
        text: $(this).html()
      }
    })
  }
}

function mapPTag ($, elm, liArticle) {
  liArticle.push({
    identifier: 'paragraph',
    id: `doc-${nanoid()}`,
    content: {
      text: $(this).text()
    }
  })
}

function mapH2Tag ($, elm, liArticle) {
  liArticle.push({
    identifier: 'subtitle',
    id: `doc-${nanoid()}`,
    content: {
      text: $(this).text()
    }
  })
}

function mapTableTag ($, elm, liArticle) {
  liArticle.push({
    identifier: 'free-html',
    id: `doc-${nanoid()}`,
    content: {
      'free-html': $(this).html()
    }
  })
}
