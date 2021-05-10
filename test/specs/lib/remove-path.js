const tap = require('tap')
const mockery = require('mockery')
const DriveStub = require('../../mocks/hyperdrive')

const fileList = []
const parentFileList = []
const statObject = { isFile: () => true }
let ignoreFileAddedTo = null
let removePath

tap.test('setup', async t => {
  mockery.enable({
    useCleanCache: true,
    warnOnUnregistered: false,
    warnOnReplace: false
  })
  mockery.registerMock('./read-archive', (a, p) => {
    const files = p === '/parentfolder' ? parentFileList : fileList
    return Promise.resolve(files)
  })
  mockery.registerMock('./utils', {
    getStatObject: () => statObject,
    writeIgnoreFile: (a, p) => {
      ignoreFileAddedTo = p
      return Promise.resolve(true)
    }
  })

  removePath = require('../../../lib/remove-path')
  t.end()
})

tap.test('removePath should unlink specified path', async t => {
  const archiveStub = new DriveStub()
  await removePath(archiveStub, '/test')
  t.equals(archiveStub._unlinkPaths.length, 1)
  t.equals(archiveStub._unlinkPaths[0], '/test')
  t.equals(archiveStub._rmDirs.length, 0)
  t.end()
})

tap.test('removePath should unlink multiple paths', async t => {
  const archiveStub = new DriveStub()
  await removePath(archiveStub, ['a', 'unit', 'test'])
  t.equals(archiveStub._unlinkPaths.length, 3)
  t.equals(archiveStub._unlinkPaths[0], 'a')
  t.equals(archiveStub._unlinkPaths[1], 'unit')
  t.equals(archiveStub._unlinkPaths[2], 'test')
  t.end()
})

tap.test('removePath should rm empty dirs', async t => {
  statObject.isDirectory = () => true
  statObject.isFile = () => false
  const archiveStub = new DriveStub()
  await removePath(archiveStub, ['test'])
  t.equals(archiveStub._unlinkPaths.length, 0)
  t.equals(archiveStub._rmDirs.length, 1)
  t.equals(archiveStub._rmDirs[0], 'test')

  // cleanup
  statObject.isDirectory = () => false
  statObject.isFile = () => true
  t.end()
})

tap.test('removePath should by default _not_ add ignore file to dir when removing all files', async t => {
  const archiveStub = new DriveStub()
  await removePath(archiveStub, ['/parentfolder/test.file'])
  t.equals(archiveStub._unlinkPaths.length, 1)
  t.equals(archiveStub._unlinkPaths[0], '/parentfolder/test.file')
  t.equals(archiveStub._rmDirs.length, 0)
  t.notOk(ignoreFileAddedTo)
  t.end()
})

tap.test('when enabled, removePath should add ignore file to dir when removing all files', async t => {
  const archiveStub = new DriveStub()
  await removePath(archiveStub, ['/parentfolder/test.file'], { addIgnoreFileToEmptyDirs: true })
  t.equals(archiveStub._unlinkPaths.length, 1)
  t.equals(archiveStub._unlinkPaths[0], '/parentfolder/test.file')
  t.equals(archiveStub._rmDirs.length, 0)
  t.equals(ignoreFileAddedTo, '/parentfolder')
  t.end()
})

tap.test('rejects on unlink error', async t => {
  const archiveStub = new DriveStub()
  archiveStub._unlinkErr = new Error()
  t.rejects(removePath(archiveStub, ['/parentfolder/test.file']))
  t.end()
})

tap.test('teardown', async t => {
  mockery.deregisterAll()
  mockery.disable()
  t.end()
})
