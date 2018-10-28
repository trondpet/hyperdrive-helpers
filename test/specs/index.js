const tap = require('tap')
const hyperHelpers = require('../../')

tap.test('exports the dang api', async t => {
  t.equals(typeof hyperHelpers.addToArchive, 'function')
  t.equals(typeof hyperHelpers.copyToFs, 'function')
  t.equals(typeof hyperHelpers.openArchive, 'function')
  t.equals(typeof hyperHelpers.readArchive, 'function')
  t.end()
})
