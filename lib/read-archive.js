const path = require('path')
const pMap = require('p-map')
const logger = require('pino')({ name: 'hyperdrive-helpers' })

const getFileMeta = (file, statObj = {}) => {
  const isFile = statObj.isFile && statObj.isFile()
  const isDirectory = statObj.isDirectory && statObj.isDirectory()

  return {
    path: file,
    isFile,
    isDirectory,
    size: statObj.size,
    atime: statObj.atime,
    ctime: statObj.ctime,
    mtime: statObj.mtime
  }
}

/**
 * Read from a hyperdrive
 */
const readArchive = async (archive, readPath) => {
  return new Promise((resolve, reject) => {
    const dirReader = async (err, files) => {
      if (err) {
        logger.error('readArchive', err)
        return reject(err)
      }

      const fileMapper = async file => {
        const statsPromise = new Promise((resolve, reject) => {
          const fullPath = path.join(readPath, file)
          archive.stat(fullPath, (err, stat) => {
            if (err) {
              reject(err)
            } else {
              resolve(stat)
            }
          })
        }).catch(e => logger.error('readArchive', e))

        const statObj = await statsPromise
        return getFileMeta(file, statObj)
      }

      const fileList = await pMap(files || [], fileMapper)
      resolve(fileList)
    }

    archive.readdir(readPath, dirReader)
  })
}

module.exports = readArchive
