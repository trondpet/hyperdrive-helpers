const tap = require('tap')
const fs = require('fs')
const sinon = require('sinon')
const copyToFs = require('../../../lib/copy-to-fs')
const StreamStub = require('../../mocks/stream')
const DriveStub = require('../../mocks/hyperdrive')

const archiveStub = new DriveStub()
const writeStream = new StreamStub()
const fsCreateWriteStub = sinon.stub(fs, 'createWriteStream')
fsCreateWriteStub.callsFake(() => writeStream)

tap.test('copyToFs should copy from archive to file system', async t => {
  const options = { dane: 'cook' }
  copyToFs(archiveStub, '/drive/path', '/dest/path', options)

  t.ok(fsCreateWriteStub.calledWith('/dest/path'))
  t.ok(archiveStub.createReadStream.calledWith('/drive/path', options))
  t.ok(archiveStub.readStream.pipe.calledWith(writeStream))

  fsCreateWriteStub.reset()
  t.end()
})
