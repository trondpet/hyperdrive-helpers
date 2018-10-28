const tap = require('tap')
const sinon = require('sinon')
const DriveStub = require('../../mocks/hyperdrive')
const StreamStub = require('../../mocks/stream')
const mockery = require('mockery')

const archiveStub = new DriveStub()
const readStream = new StreamStub()
const stubCreateReadStream = sinon.stub()
let readStreamArgs = []
stubCreateReadStream.callsFake(fPath => {
  readStreamArgs.push(fPath)
  return readStream
})

let addToArchive

tap.test('setup', async t => {
  mockery.enable({
    useCleanCache: true,
    warnOnUnregistered: false,
    warnOnReplace: false
  })

  mockery.registerMock('fs', {
    readdir: (dir, cb) => {
      if (dir.indexOf('LCK') > -1) {
        cb(null, [ 'a.txt', 'b.txt', 'c.txt', 'dang' ])
      } else {
        cb(null, [])
      }
    },
    stat: (p, cb) => {
      const isDir = p === '/Users/Dane.Cook/Documents/Jokes/LCK/dang'
      const stubStatObj = {
        isFile: () => !isDir,
        isDirectory: () => isDir
      }
      cb(null, stubStatObj)
    },
    createReadStream: stubCreateReadStream
  })

  addToArchive = require('../../../lib/add-to-archive')

  t.end()
})

tap.test('addToArchive should copy from file system to hyperdrive archive', async t => {
  readStream.on = (evt, handler) => handler()
  await addToArchive(archiveStub, [ '/Users/Dane.Cook/Documents/Jokes/LCK', '/Users/Dane.Cook/Documents/Jokes/DC' ])

  t.similar(readStreamArgs, [
    '/Users/Dane.Cook/Documents/Jokes/LCK/a.txt',
    '/Users/Dane.Cook/Documents/Jokes/LCK/b.txt',
    '/Users/Dane.Cook/Documents/Jokes/LCK/c.txt'
  ])
  t.ok(archiveStub.createWriteStream.called)
  t.ok(readStream.pipe.calledWith(archiveStub.writeStream))
  t.similar(archiveStub._mkDirs, [ '/Users/Dane.Cook/Documents/Jokes/LCK/dang' ])

  t.end()
})

tap.test('teardown', async t => {
  mockery.deregisterAll()
  mockery.disable()
  t.end()
})
