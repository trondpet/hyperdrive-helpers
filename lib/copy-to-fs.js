const fs = require('fs')
const streamCopy = require('./stream-copy')

/**
 * Copy file from hyperdrive archive to file system
 */
const copyToFs = async (archive, filePath, savePath, options) => {
  const writeStream = fs.createWriteStream(savePath)
  const readStream = archive.createReadStream(filePath, options)
  return streamCopy(readStream, writeStream)
}

module.exports = copyToFs
