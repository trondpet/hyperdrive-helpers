/**
 * Pipe from stream a -> stream b
 */
const streamCopy = async (readStream, writeStream) => {
  return new Promise((resolve, reject) => {
    const errorHandler = err => {
      readStream.destroy()
      writeStream.destroy()
      reject(err)
    }

    readStream.on('error', errorHandler)
    writeStream.on('error', errorHandler)
    writeStream.on('finish', resolve)

    readStream.pipe(writeStream)
    readStream.once('error', err => writeStream.emit('error', err))
  })
}

module.exports = streamCopy
