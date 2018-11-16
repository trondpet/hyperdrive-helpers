const sinon = require('sinon')

class Stream {
  constructor (name) {
    this.events = {}
    this.destroy = sinon.stub()
    this.pipe = sinon.stub()
    this.name = name
  }

  on (evt, handler) {
    this.events[evt] = handler
  }

  once (evt, handler) {
    this.events[evt] = handler
  }

  emit (name, data) {
    this.events[name](data)
  }
}

module.exports = Stream
