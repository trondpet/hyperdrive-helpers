const tap = require('tap')
const streamCopy = require('../../../lib/stream-copy')
const StubStream = require('../../mocks/stream')

tap.test('should pipe from a to b', async t => {
  const ins = new StubStream()
  const outs = new StubStream()
  streamCopy(ins, outs)

  // resolve promise
  t.ok(outs.events.finish)
  outs.events.finish()

  t.ok(ins.pipe.calledWith(outs))
  t.end()
})

tap.test('should destroy streams on error', async t => {
  const ins = new StubStream()
  const outs = new StubStream()
  streamCopy(ins, outs).catch(() => {})

  // setup erroro handlers
  t.ok(ins.events.error)
  t.ok(outs.events.error)

  // destroys streams on error
  ins.events.error({})
  t.ok(ins.destroy.calledOnce)
  t.ok(outs.destroy.calledOnce)
  t.end()
})
