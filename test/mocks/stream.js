const sinon = require('sinon')

class Stream {
  constructor () {
    this.events = {}
    this.destroy = sinon.stub()
    this.pipe = sinon.stub()
  }

  on (evt, handler) {
    this.events[evt] = handler
  }
}

module.exports = Stream
