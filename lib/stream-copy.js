/**
 * Pipe from stream a -> stream b
 */
const streamCopy = (readStream, writeStream) => {
  return new Promise((resolve, reject) => {
    const errorHandler = err => {
      readStream.destroy()
      writeStream.destroy()
      reject(err)
    }

    readStream.on('error', errorHandler)
    readStream.once('error', err => writeStream.emit('error', err))

    writeStream.on('error', errorHandler)
    writeStream.on('finish', resolve)

    readStream.pipe(writeStream)
  })
}

module.exports = streamCopy
