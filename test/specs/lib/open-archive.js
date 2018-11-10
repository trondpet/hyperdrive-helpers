const tap = require('tap')
const sinon = require('sinon')
const mockery = require('mockery')
const DriveStub = require('../../mocks/hyperdrive')

let openArchive
let archiveStub
let hyperArgs
let netArgs = {}

const netStub = {
  join: sinon.stub().callsFake((key, options) => { netArgs.join = { key, options } }),
  on: sinon.stub().callsFake((evt, handler) => { netArgs['on' + evt] = handler })
}

tap.test('setup', t => {
  mockery.enable({
    useCleanCache: true,
    warnOnReplace: false,
    warnOnUnregistered: false
  })

  archiveStub = new DriveStub()
  mockery.registerMock('hyperdrive', (name, key, options) => {
    hyperArgs = { name, key, options }
    return archiveStub
  })

  mockery.registerMock('@hyperswarm/network', () => netStub)

  openArchive = require('../../../lib/open-archive')
  t.end()
})

tap.test('openArchive should open a hyperdrive', async t => {
  const options = { drive: {} }
  const { archive, discoveryKey, key, writable } = await openArchive('test', 'danekey', options)
  t.ok(archive)
  t.same(archive, archiveStub)
  t.equal(discoveryKey, 'testDiscoveryKey')
  t.equal(key, 'testKey')
  t.equal(writable, true)
  t.equal(hyperArgs.name, 'test')
  t.type(hyperArgs.key, 'Buffer')
  t.same(hyperArgs.options, options.drive)
  t.end()
})

tap.test('openArchive should execute onReady option on...ready', async t => {
  const onReady = sinon.stub()
  await openArchive('test', 'danekey', { onReady })
  t.ok(onReady.calledOnce)
  t.end()
})

tap.test('openArchive does not attempt to join swarm w/o network options', async t => {
  const options = { replicate: { upload: true } }
  await openArchive('test', 'danekey', options)
  t.notOk(netStub.join.calledOnce)
  t.notOk(netStub.on.calledOnce)
  t.notOk(netArgs.onconnection)

  t.end()
})

tap.test('openArchive does not attempt to join swarm w/o replicate options', async t => {
  const options = { network: { lookup: true } }
  await openArchive('test', 'danekey', options)
  t.notOk(netStub.join.calledOnce)
  t.notOk(netStub.on.calledOnce)
  t.notOk(netArgs.onconnection)

  t.end()
})

tap.test('openArchive should join swarm and replicate if network & replicate options are passed', async t => {
  const options = { network: { lookup: true, announce: true }, replicate: { upload: true } }
  const { archive } = await openArchive('test', 'danekey', options)
  t.ok(netStub.join.calledOnce)
  t.ok(netStub.on.calledOnce)

  // socket.pipe(archive.replicate()).pipe(socket)
  const pipe1Stub = sinon.stub()
  const pipe2Stub = sinon.stub().returns({ pipe: pipe1Stub })
  const socketStub = { pipe: pipe2Stub }

  netArgs.onconnection(socketStub)
  t.ok(pipe1Stub.calledWith(socketStub))
  t.ok(pipe2Stub.calledWith('archive is replicating'))

  t.equal(netArgs.join.key.toString(), 'testDiscoveryKey')
  t.same(netArgs.join.options, options.network)
  t.same(archive._replicateOptions, { upload: true })

  t.end()
})

tap.test('openArchive should throw if no path is specified', async t => {
  t.rejects(openArchive(), 'Missing archive name')
  t.end()
})

tap.test('teardown', t => {
  mockery.deregisterAll()
  mockery.disable()
  t.end()
})
