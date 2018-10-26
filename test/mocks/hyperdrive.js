const sinon = require('sinon')
const Stream = require('./stream')

class Drive {
  constructor () {
    this.discoveryKey = { toString: () => 'testDiscoveryKey' }
    this.key = { toString: () => 'testKey' }
    this.events = {}
    this.readStream = new Stream()
    this.writeStream = new Stream()

    this.createReadStream = sinon.stub().returns(this.readStream)
    this.createWriteStream = sinon.stub().returns(this.writeStream)
    this.on = sinon.stub().callsFake((evt, handler) => {
      this.events[evt] = this.events[evt] || []
      this.events[evt].push(handler)
      if (evt === 'ready') {
        handler()
      }
    })
    this.replicate = sinon.stub().returns('archive is replicating')
  }
}

module.exports = Drive
