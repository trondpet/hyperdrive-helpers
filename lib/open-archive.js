const logger = require('pino')({ name: 'hyperdrive-helpers' })
const hyperdrive = require('hyperdrive')
const network = require('@hyperswarm/network')

/**
 * Open a hyperdrive
 *
 * Options:
 * {
 *   drive: hyperdrive options,
 *   replicate: replication options,
 *   onReady: onReady cb
 * }
 */
const openArchive = async (name, key, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!name) {
      return reject(new Error('Missing archive name'))
    }

    // the hyperdrive archive
    let archive

    const returnMeta = () => {
      resolve({
        archive,
        name: name,
        discoveryKey: archive.discoveryKey.toString('hex'),
        key: archive.key.toString('hex'),
        writable: archive.metadata.writable
      })
    }

    try {
      const keyBuf = key && Buffer.from(key, 'hex')
      archive = hyperdrive(name, keyBuf, options.drive)
    } catch (err) {
      reject(err)
    }

    const replOpts = options.replicate
    const netOpts = options.network
    if (typeof netOpts === 'object' && netOpts &&
        typeof replOpts === 'object' && replOpts) {
      const connect = () => {
        try {
          const net = network()
          net.join(archive.discoveryKey, netOpts)
          net.on('connection', socket => {
            logger.info('Connected & starting replication')
            socket.pipe(archive.replicate(replOpts)).pipe(socket)
          })
        } catch (err) {
          logger.error(err)
        }
      }
      archive.on('ready', connect)
    }

    // additional onReady handler?
    if (options.onReady) {
      archive.on('ready', options.onReady)
    }

    archive.on('ready', returnMeta)
  })
}

module.exports = openArchive
