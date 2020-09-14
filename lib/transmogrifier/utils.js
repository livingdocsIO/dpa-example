const entities = require('entities')
const htmlparser2 = require('htmlparser2')

const api = {

  encodeXml (content) {
    return entities.encodeXML(content)
  },

  getText (directiveContent) {
    let fullText = ''
    const parser = new htmlparser2.Parser({
      ontext (text) {
        fullText += text
      }
    },
    {decodeEntities: true})
    parser.write(directiveContent)
    parser.end()
    return fullText
  },

  // Parses component identifiers and returns the componentName without
  // the designName.
  //
  // Examples:
  // `designName.componentName` -> `componentName`
  // `componentName` -> `componentName`
  getComponentName (identifier) {
    if (!identifier) return // silently fail on undefined or empty strings

    const parts = identifier.split('.')

    if (parts.length === 1) {
      // return {designName: undefined, name: parts[0]}
      return parts[0]
    } else if (parts.length === 2) {
      // return {designName: parts[0], name: parts[1]}
      return parts[1]
    } else {
      throw new Error(`could not parse component template identifier: ${identifier}`)
    }
  }
}

module.exports = api
