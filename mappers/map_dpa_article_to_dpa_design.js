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
      case 'dnl-youtubeembed':
        mapYoutubeEmbed.call(this, $, elm, liArticle)
        break
      case 'dnl-twitterembed':
        mapTwitterEmbed.call(this, $, elm, liArticle)
         break
      case 'a':
        mapATag.call(this, $, elm, liArticle)
        break
      case 'p':
        mapPTag.call(this, $, elm, liArticle)
        break
      case 'h2':
        mapH2Tag.call(this, $, elm, liArticle)
        break
      case 'table':
        mapTableTag.call(this, $, elm, liArticle)
        break
      default:
        console.error(`unhandled dpa html tag: ${elm.name}`)
    }
  })
  // Note: infobox and linkbox are ignored atm, feel free to add them with a PR
  return liArticle
}

function mapATag ($, elm, liArticle) {
  // just wrap in a p tag
  liArticle.push({
    identifier: 'paragraph',
    id: `doc-${nanoid()}`,
    content: {
      text: $(this).html()
    }
  })
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
      'free-html': `<table>${$(this).html()}</table>`
    }
  })
}

function mapYoutubeEmbed ($, elm, liArticle) {
  const embedUrl = elm.attribs.src
  liArticle.push({
    identifier: 'iframe',
    id: `doc-${nanoid()}`,
    content: {
      iframe: `<div class="responsiveContainer"
        style="position: relative; height: 0px; overflow: hidden; max-width: 100%; padding-bottom: 55%;">
          <iframe src="${embedUrl}"
            frameborder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen=""
            style="position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;">
          </iframe>
        </div>`
    }
  })
}

function mapTwitterEmbed ($, elm, liArticle) {
  const url = elm.attribs.src
  const parts = url.split('/')
  // simple assumption that id is always last part of url
  const id = parts[parts.length - 1]
  liArticle.push({
    identifier: 'tweet',
    id: `doc-${nanoid()}`,
    content: {
      tweet: `<div class="twitter-tweet twitter-tweet-rendered"
        style="display: flex; max-width: 550px; width: 100%; margin-top: 10px; margin-bottom: 10px;">
          <iframe id="twitter-widget-0" scrolling="no" frameborder="0"
            allowtransparency="true" allowfullscreen="true" class=""
            style="position: static; visibility: visible; width: 550px; height: 561px;
            display: block; flex-grow: 1;" title="Twitter Tweet"
            src="https://platform.twitter.com/embed/index.html?dnt=false&amp;embedId=twitter-widget-0&amp;frame=false&amp;hideCard=false&amp;hideThread=false&amp;id=1305463562878382081&amp;lang=en&amp;origin=about%3Ablank&amp;partner=tweetdeck&amp;theme=light&amp;widgetsVersion=219d021%3A1598982042171&amp;width=550px"
            data-tweet-id="${id}" tabindex="-1">
          </iframe>
        </div>`
    }
  })
}
