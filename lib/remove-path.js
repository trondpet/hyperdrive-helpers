const path = require('path')
const readArchive = require('./read-archive')
const { getStatObject, writeIgnoreFile } = require('./utils')
const { IGNORE_FILE } = require('./constants')
const logger = require('pino')({ name: 'hyperdrive-helpers' })

/**
 * Delete selected path(s) from a hyperdrive
 *
 * options: { addIgnoreFileToEmptyDirs }
 */
const removePath = async (archive, paths, options = {}) => {
  // promise to remove a directory
  const createRmdirPromise = async dir => {
    return new Promise((resolve, reject) => {
      logger.info(`rmdir: ${dir}`)
      archive.rmdir(dir, err => {
        return err ? reject(err) : resolve()
      })
    })
  }

  // promise to remove a path (dir or file)
  const createUnlinkPromise = async fPath => {
    const statObj = await getStatObject(archive, fPath)
    const isFile = statObj.isFile()

    if (isFile) {
      logger.info(`unlink: ${fPath}`)
      return new Promise((resolve, reject) => {
        archive.unlink(fPath, err => {
          return err ? reject(err) : resolve()
        })
      })
    } else {
      const files = await readArchive(archive, fPath)
      if (files.length) {
        // directory w/files -- remove all files within the dir, then proceed w/dir removal
        // TODO looks like hyperdrive auto-removes empty dirs, so this might not be necessary...
        await Promise.all(files.map(f => createUnlinkPromise(f.path))).catch(e => logger.error(e))
        return createRmdirPromise(fPath)
      } else {
        // empty dir -- remove the sucker
        return createRmdirPromise(fPath)
      }
    }
  }

  // add an ignore file to parent dir if it's going to be empty after this operation
  const ensureNonEmptyParentDir = async (fPath, pathsArr) => {
    if (fPath === path.sep) {
      return
    }
    // for the item at the path we are deleting;
    // if the parent dir has no content except the item we are removing
    // then add a `.pepperignore` file so hyperdrive will retain the folder
    const parentPath = path.dirname(fPath)
    const parentContent = await readArchive(archive, parentPath).catch(e => logger.error(e)) || []
    const isIgnoreFile = file => file.indexOf(IGNORE_FILE) > -1
    const hasIgnoreFile = parentContent.find(itm => isIgnoreFile(itm.path))
    const isDeletingAll = parentContent.every(itm => {
      // if every file is either contained in paths array or ignore file => deleting 'em all
      return pathsArr.indexOf(itm.path) > -1 || isIgnoreFile(itm.path)
    })

    // only write ignore file if we're removing all files, and there's no ignore file already present
    if (isDeletingAll && !hasIgnoreFile) {
      await writeIgnoreFile(archive, parentPath).catch(e => logger.error(e))
    }
  }

  // paths can be either single path or array of paths
  const pathsArr = Array.isArray(paths) ? paths : [ paths ]

  // make sure something will be left so dir structure is left even if every file is removed
  if (options.addIgnoreFileToEmptyDirs) {
    pathsArr.forEach(fPath => {
      ensureNonEmptyParentDir(fPath, pathsArr)
    })
  }

  // create a promis for every path in args
  const rmPromises = pathsArr.map(fPath => {
    const unlinkPromise = createUnlinkPromise(fPath)
    return Array.isArray(unlinkPromise) ? Promise.all(unlinkPromise) : unlinkPromise
  })

  return Promise.all(rmPromises)
}

module.exports = removePath
