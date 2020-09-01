const dynamodb = require('serverless-dynamodb-client')
const TableName = 'ImportsTable'
const client = dynamodb.doc

module.exports = {
  getDPAArticlesImport: async function (batchId) {
    const params = {
      TableName,
      Key: {batchId}
    }
    try {
      const data = await client.get(params).promise()
      return data.Item.dpaArticles
    } catch (err) {
      console.error('Error getting from dynamodb', err)
    }
  },
  storeImageImportWithDPAArticles: async function (batchId, articles) {
    const params = {
      TableName,
      Item: {
        batchId: batchId,
        dpaArticles: articles
      }
    }
    try {
      const data = await client.put(params).promise()
      console.log('import batch id stored', batchId)
    } catch (err) {
      console.error('Error writing to dynamodb', err)
    }
  },
  storeDocumentImport: async function (batchId) {
    const params = {
      TableName,
      Item: {
        batchId: batchId
      }
    }
    try {
      const data = await client.put(params).promise()
      console.log('import batch id stored', batchId)
    } catch (err) {
      console.error('Error writing to dynamodb', err)
    }
  },
  failImport: async function (batchId, error) {
    const params = {
      TableName,
      Key: {batchId},
      UpdateExpression: 'set #status = :status, #error = :error',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#error': 'error'
      },
      ExpressionAttributeValues: {
        ':status': 'failed',
        ':error': error
      }
    }
    try {
      await client.update(params).promise()
      console.log(`Set ${batchId} to failed`)
    } catch (err) {
      console.error('Error updating dynamodb', err)
    }
  },
  succeedImport: async function (batchId) {
    const params = {
      TableName,
      Key: {batchId},
      UpdateExpression: 'set #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'success'
      }
    }
    try {
      await client.update(params).promise()
      console.log(`Set ${batchId} to success`)
    } catch (err) {
      console.error('Error updating dynamodb', err)
    }
  }
}
