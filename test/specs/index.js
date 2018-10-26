const tap = require('tap')
const hyperHelpers = require('../../')

tap.test('exports the dang api', async t => {
  t.ok(hyperHelpers.addToArchive)
  t.ok(hyperHelpers.copyToFs)
  t.ok(hyperHelpers.openArchive)
  t.ok(hyperHelpers.readArchive)
})
