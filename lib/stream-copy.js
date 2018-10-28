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
    readStream.on('end', resolve)
    readStream.on('error', errorHandler)
    writeStream.on('error', errorHandler)
    readStream.pipe(writeStream)
  })
}

module.exports = streamCopy
