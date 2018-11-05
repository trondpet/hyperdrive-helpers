const addToArchive = require('./lib/add-to-archive')
const openArchive = require('./lib/open-archive')
const copyToFs = require('./lib/copy-to-fs')
const readArchive = require('./lib/read-archive')
const removePath = require('./lib/remove-path')

module.exports = { addToArchive, copyToFs, openArchive, readArchive, removePath }
