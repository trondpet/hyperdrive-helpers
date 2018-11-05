const logger = require('pino')({ name: 'hyperdrive-helpers' })
const path = require('path')
const { IGNORE_FILE } = require('./constants')

const getStatObject = (archive, path) => {
  return new Promise((resolve, reject) => {
    archive.stat(path, (err, statObj) => {
      if (err) {
        reject(err)
      } else {
        resolve(statObj)
      }
    })
  })
}

const getFileMeta = async (archive, path) => {
  const statObj = await getStatObject(archive, path).catch(e => logger.error(e)) || {}
  const isFile = statObj.isFile && statObj.isFile()
  const isDirectory = statObj.isDirectory && statObj.isDirectory()

  return {
    path,
    isFile,
    isDirectory,
    size: statObj.size,
    atime: statObj.atime,
    ctime: statObj.ctime,
    mtime: statObj.mtime
  }
}

const writeIgnoreFile = (archive, fPath) => {
  return new Promise((resolve, reject) => {
    const ignorePath = path.join(fPath, IGNORE_FILE)
    logger.info(`Writing ignore file at ${ignorePath}`)
    archive.writeFile(ignorePath, '420', err => {
      return err ? reject(err) : resolve()
    })
  })
}

module.exports = { getStatObject, getFileMeta, writeIgnoreFile }
