const path = require('path')
const pMap = require('p-map')
const { getFileMeta } = require('./utils')
const logger = require('pino')({ name: 'hyperdrive-helpers' })

/**
 * Read from a hyperdrive and return list of file models
 */
const readArchive = async (archive, readPath) => {
  return new Promise((resolve, reject) => {
    const dirReader = async (err, files) => {
      if (err) {
        logger.error('readArchive', err)
        return reject(err)
      }

      const fileMapper = file => getFileMeta(archive, path.join(readPath, file))
      const fileList = await pMap(files || [], fileMapper)
      resolve(fileList)
    }

    archive.readdir(readPath, dirReader)
  })
}

module.exports = readArchive
