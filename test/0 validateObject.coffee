Publisher = require("..").Publisher

describe "emitter", ->
    publisher = null
    emitter = null

    beforeEach ->
        publisher = new Publisher()
        emitter = publisher.emitter

    it "should implement a `on` method", ->
        emitter.should.respondTo("on")
    it "should implement a `once` method", ->
        emitter.should.respondTo("once")
    it "should implement a `onMatch` method", ->
        emitter.should.respondTo("onMatch")
    it "should implement a `off` method", ->
        emitter.should.respondTo("off")
