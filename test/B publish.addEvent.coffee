Publisher = require("..").Publisher

describe "publish.addEvent", ->
    publisher = null
    emitter = null

    describe "when adding an event", ->
        beforeEach ->
            publisher = new Publisher(events: ["event1", "event2"])
            emitter = publisher.emitter
            publisher.publish.addEvent("event3")

        it "should publish the supplied events as usual", ->
            listener1 = sinon.spy()
            listener2 = sinon.spy()
            listener3 = sinon.spy()

            emitter.on("event1", listener1)
            emitter.on("event2", listener2)
            emitter.on("event3", listener3)

            publisher.publish("event1")
            publisher.publish("event2")
            publisher.publish("event3")

            listener1.should.have.been.called
            listener2.should.have.been.called
            listener3.should.have.been.called
