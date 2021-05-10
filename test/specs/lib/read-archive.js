const tap = require('tap')
const sinon = require('sinon')
const readArchive = require('../../../lib/read-archive')
const DriveStub = require('../../mocks/hyperdrive')

tap.test('readArchive should handle read error', async t => {
  const archiveStub = new DriveStub()
  archiveStub._readDirErr = 'test'
  t.rejects(readArchive(archiveStub, 'a'))
  t.end()
})

tap.test('readArchive should, um, read from the archive and return metadata on each file', async t => {
  const archiveStub = new DriveStub()
  const statObj = {
    isFile: sinon.stub().returns(true),
    isDirectory: sinon.stub().returns(false),
    size: 420,
    atime: 4,
    ctime: 2,
    mtime: 1
  }

  archiveStub.stat = (path, cb) => cb(null, statObj)
  archiveStub._readDirFiles = ['famous-aj-pics', 'dane-cook.png', 'nude-tayne.jpg']

  const files = await readArchive(archiveStub, '/danathan')
  // read the dir w/correct path
  t.equals(archiveStub._readDirPath, '/danathan')

  // got data on all three files
  t.equals(3, files.length)

  // got file/dir flag
  t.ok(statObj.isFile.calledThrice)
  t.ok(statObj.isDirectory.calledThrice)

  // returned all expected fields (and values)
  const tayne = files[2]
  t.ok(tayne.isFile)
  t.notOk(tayne.isDirectory)
  t.equals(tayne.size, 420)
  t.equals(tayne.atime, 4)
  t.equals(tayne.ctime, 2)
  t.equals(tayne.mtime, 1)

  t.end()
})

tap.test('readArchive should handle error while stating single file', async t => {
  const archiveStub = new DriveStub()
  const statObj = {
    isFile: sinon.stub().returns(true),
    isDirectory: sinon.stub().returns(true)
  }

  archiveStub.stat = (p, cb) => {
    return p === '/4d3d3d3/nude-tayne.jpg' ? cb(new Error('oh dang!')) : cb(null, statObj)
  }
  archiveStub._readDirFiles = ['famous-aj-pics', 'nude-tayne.jpg', 'dane-cook.png']

  const files = await readArchive(archiveStub, '/4d3d3d3')
  // got info on all the files
  t.equals(3, files.length)

  const tayne = files[1]
  t.equals(tayne.path, '/4d3d3d3/nude-tayne.jpg')
  t.notOk(tayne.isFile)
  t.notOk(tayne.isDirectory)

  const dane = files[2]
  t.equals(dane.path, '/4d3d3d3/dane-cook.png')
  t.ok(dane.isFile)
  t.ok(dane.isDirectory)

  t.end()
})
