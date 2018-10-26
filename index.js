const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const logger = require('pino')({ name: 'hyperdrive-helpers' })
const pfilter = require('p-filter')
const pMap = require('p-map')

const readDir = promisify(fs.readdir)
const stat = promisify(fs.stat)

const streamCopy = require('./lib/stream-copy')
const openArchive = require('./lib/open-archive')
const copyToFs = require('./lib/copy-to-fs')

const addHyperFile = (archive, dir) => {
  return async file => {
    const fullPath = path.join(dir, file)
    try {
      const readStream = fs.createReadStream(fullPath)
      const writeStream = archive.createWriteStream(fullPath)
      await streamCopy(readStream, writeStream)
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
      return await addHyperDir(archive, fullPath)
    } catch (e) {
      logger.error(e)
    }
  }
}

const addHyperDir = async (archive, dir) => {
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
    const dirRes = await readDir(dir)
    const files = await pfilter(dirRes, isFile)
    const dirs = await pfilter(dirRes, isDir)
    const addFile = addHyperFile(archive, dir)
    const mkDir = mkHyperDir(archive, dir)

    const promises = files
      .map(addFile)
      .concat(dirs.map(mkDir))

    return Promise.all(promises).catch(e => logger.error(e))
  } catch (e) {
    logger.error('Error adding hyper dir')
    logger.error(e)
  }
}

const addToArchive = async (archive, filePaths) => {
  const promises = []
  if (filePaths && filePaths.length) {
    filePaths.map(async fPath => {
      // keep order to avoid confusion
      promises.push(addHyperDir(archive, fPath))
    })
  }
  return Promise.all(promises).catch(e => logger.error(e))
}

const readArchive = (archive, readPath) => {
  return new Promise((resolve, reject) => {
    archive.readdir(readPath, async (err, files) => {
      if (err) {
        // TODO handle error
        logger.error('readdir', err)
        return reject(err)
      }

      const fileList = await pMap(files || [], async file => {
        let isFile = false
        try {
          const s = await stat(path.join(readPath, file))
          isFile = s && s.isFile()
        } catch (e) {
          logger.error(e)
        }
        return { filePath: file, isFile }
      })

      resolve(fileList)
    })
  })
}

module.exports = { addToArchive, copyToFs, openArchive, readArchive }
