const tap = require('tap')
const utils = require('../../../lib/utils')
const DriveStub = require('../../mocks/hyperdrive')

tap.test('getStatObject should return stat object', async t => {
  const archiveStub = new DriveStub()
  const statObj = { test: 'object' }
  archiveStub.stat = (path, cb) => cb(null, statObj)
  const stat = await utils.getStatObject(archiveStub, 'test')

  t.equals(stat, statObj)
  t.end()
})

tap.test('getStatObject should reject on error', async t => {
  const archiveStub = new DriveStub()
  archiveStub.stat = (path, cb) => cb(new Error('boom'))

  t.rejects(utils.getStatObject(archiveStub, 'test'))
  t.end()
})

tap.test('getFileMeta should return corret type of object', async t => {
  const archiveStub = new DriveStub()
  const statObj = { isFile: () => true, isDirectory: () => false, atime: 1, ctime: 2, mtime: 3, size: 420 }
  archiveStub.stat = (path, cb) => cb(null, statObj)

  const stat = await utils.getFileMeta(archiveStub, '/unit/test')
  t.similar(stat, {
    path: '/unit/test',
    isFile: true,
    isDirectory: false,
    atime: 1,
    ctime: 2,
    mtime: 3,
    size: 420
  })
  t.end()
})

tap.test('writeIgnoreFile should write a file to dir', async t => {
  const archiveStub = new DriveStub()

  await utils.writeIgnoreFile(archiveStub, '/unit/test')
  t.equals(archiveStub._writtenFiles.length, 1)
  t.equals(archiveStub._writtenFiles[0].path, '/unit/test/.hyperdriveignore')
  t.equals(archiveStub._writtenFiles[0].content, '420')
  t.end()
})

tap.test('writeIgnoreFile should reject on error', async t => {
  const archiveStub = new DriveStub()
  archiveStub._writeFileErr = new Error('hot dang')

  t.rejects(utils.writeIgnoreFile(archiveStub, '/unit/test'))
  t.end()
})
