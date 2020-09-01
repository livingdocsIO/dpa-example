module.exports = {
  mapMetadata: function (dpaImage) {
    return {
      title: dpaImage.headline,
      caption: dpaImage.caption,
      source: dpaImage.creditline,
      createdAt: dpaImage.version_created
    }
  }
}
