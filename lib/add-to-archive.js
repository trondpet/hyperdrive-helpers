const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const pfilter = require('p-filter')
const readDir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const logger = require('pino')({ name: 'hyperdrive-helpers' })
const streamCopy = require('./stream-copy')

const addHyperFile = (archive, dir) => {
  return file => {
    const fullPath = path.join(dir, file)
    try {
      const readStream = fs.createReadStream(fullPath)
      const writeStream = archive.createWriteStream(fullPath)
      return streamCopy(readStream, writeStream)
    } catch (e) {
      logger.error(e)
    }
  }
}

const mkHyperDir = (archive, dir) => {
  return async childDir => {
    const fullPath = path.join(dir, childDir)
    try {
      await new Promise((resolve, reject) => {
        archive.mkdir(fullPath, err => (err ? reject(err) : resolve()))
      })
      return addHyperDir(archive, fullPath)
    } catch (e) {
      logger.error(e)
    }
  }
}

const addHyperDir = async (archive, dir, fileList) => {
  const isFile = async f => {
    try {
      const s = await stat(path.join(dir, f))
      return s.isFile()
    } catch (e) {
      logger.error(e)
    }
  }

  const isDir = async f => {
    try {
      const s = await stat(path.join(dir, f))
      return s.isDirectory()
    } catch (e) {
      logger.error(e)
    }
  }

  try {
    // either use supplied list (already known), or read what's in the dir
    const dirRes = fileList || await readDir(dir)
    const files = await pfilter(dirRes, isFile) || []
    const dirs = await pfilter(dirRes, isDir) || []

    // all the promises we wish to keep
    let promises = []

    // add all files in this dir
    const addFile = addHyperFile(archive, dir)
    const addFiles = files.map(addFile)
    promises = promises.concat(addFiles)

    // next move up to next level
    const mkDir = mkHyperDir(archive, dir)
    const mkDirs = dirs.map(mkDir)
    promises = promises.concat(mkDirs)

    // empty dir -- add just the dir
    if (!addFiles.length && !mkDirs.length) {
      promises.push(new Promise((resolve, reject) => {
        archive.mkdir(dir, err => (err ? reject(err) : resolve()))
      }).catch(err => logger.error(err)))
    }

    return Promise.all(promises)
  } catch (e) {
    logger.error('Error adding hyper dir')
    logger.error(e)
  }
}

/**
 * Add a directory to hyperdrive
 * TODO: support destination folder (i.e. not always root)
 */
const addToArchive = (archive, filePaths) => {
  if (!filePaths || !filePaths.length) {
    return Promise.reject(new Error('Invalid argument; need paths to copy'))
  }

  // keep order to avoid confusion
  const promises = filePaths.map(async fPath => {
    // adding file or dir?
    const statObj = await stat(fPath).catch(e => logger.error(e))
    if (statObj.isFile()) {
      const dirName = path.dirname(fPath)
      const fileName = path.basename(fPath)
      // only add the selected file
      const fileList = [ fileName ]
      return addHyperDir(archive, dirName, fileList).catch(e => logger.error(e))
    } else {
      // add whatever's in the dang dir
      return addHyperDir(archive, fPath).catch(e => logger.error(e))
    }
  })

  return Promise.all(promises).catch(e => logger.error(e))
}

module.exports = addToArchive
