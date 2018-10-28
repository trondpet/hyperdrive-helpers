# hyperdrive-helpers
Helpers for working with Hyperdrives.

## API

All the stuff's `async`.

### openArchive

Opens a hyperdrive and returns a handle to the archive & keys


```
const { openArchive } = require('hyperdrive-helpers')

const { archive, discoveryKey, key } = await openArchive('/myarchive')
```

### addToArchive

Adds a folder w/files to the archive

```
const { openArchive, addToArchive } = require('hyperdrive-helpers')

const { archive } = await openArchive('/myarchive')
await addToArchive(archive, [ '/Users/Dane.Cook/stuff' ])
```

### readArchive

Reads a dir in an archive

```
const { openArchive, readArchive } = require('hyperdrive-helpers')

const { archive } = await openArchive('/myarchive')
const contents = await readArchive(archive, '/Users/Dane.Cook/stuff' )

const { path, isFile, isDirectory, size, atime, ctime, mtime } = contents[0]

```

### copyToFs

Copy a file from a hyperdrive to the file system

```
const { openArchive, copyToFs } = require('hyperdrive-helpers')

const { archive } = await openArchive('/myarchive')
await copyToFs(archive, '/important-doc.txt', '/Users/Dane.Cook/Downloads')

```