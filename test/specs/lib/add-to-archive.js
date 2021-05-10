const tap = require('tap')
const sinon = require('sinon')
const DriveStub = require('../../mocks/hyperdrive')
const StreamStub = require('../../mocks/stream')
const mockery = require('mockery')

const archiveStub = new DriveStub()
const readStream = new StreamStub('fsReadStream')
const stubCreateReadStream = sinon.stub()
stubCreateReadStream.returns(readStream)

let addToArchive

tap.test('setup', async t => {
  mockery.enable({
    useCleanCache: true,
    warnOnUnregistered: false,
    warnOnReplace: false
  })

  mockery.registerMock('fs', {
    readdir: (dir, cb) => {
      if (dir === '/test1' || dir === '/test1/dang') {
        cb(null, ['a.txt', 'b.txt', 'c.txt', 'dang'])
      } else {
        cb(null, [])
      }
    },
    stat: (p, cb) => {
      const isDir = p.indexOf('.') === -1
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
  readStream.pipe = ws => ws.events.finish()
  await addToArchive(archiveStub, ['/test1', '/test2', '/test3.txt', '/test4']).catch(e => console.error(e))
  t.ok(stubCreateReadStream.called)

  // wrote all the files but not non-empty dirs (cause the files are inside the dang dirs)
  t.ok(stubCreateReadStream.calledWith('/test1/a.txt'))
  t.ok(stubCreateReadStream.calledWith('/test1/b.txt'))
  t.ok(stubCreateReadStream.calledWith('/test1/c.txt'))
  t.ok(stubCreateReadStream.calledWith('/test1/dang/a.txt'))
  t.ok(stubCreateReadStream.calledWith('/test1/dang/b.txt'))
  t.ok(stubCreateReadStream.calledWith('/test1/dang/c.txt'))
  t.ok(stubCreateReadStream.calledWith('/test3.txt'))

  t.notOk(stubCreateReadStream.calledWith('/test1'))
  t.notOk(stubCreateReadStream.calledWith('/test1/dang'))
  t.notOk(stubCreateReadStream.calledWith('/test2'))
  t.notOk(stubCreateReadStream.calledWith('/test4'))

  // created the empty dirs
  t.ok(archiveStub.createWriteStream.called)
  t.similar(archiveStub._mkDirs, ['/test2', '/test4'])

  t.end()
})

tap.test('addToArchive rejects if theres no valid input', async t => {
  t.rejects(addToArchive(archiveStub, null))
  t.rejects(addToArchive(archiveStub, []))
  t.end()
})

tap.test('teardown', async t => {
  mockery.deregisterAll()
  mockery.disable()
  t.end()
})
