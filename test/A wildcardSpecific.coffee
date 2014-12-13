Publisher = require("..").Publisher

describe "Publisher/emitter using wildcard", ->
    publisher = null
    emitter = null

    beforeEach ->
        publisher = new Publisher()
        emitter = publisher.emitter

    describe "when '*' is used to subscribed to events", ->
        events = ["event1", "event2", "event3", "Event4"]
        listener = null
        unsubscribe = null

        beforeEach ->
            listener = sinon.spy()
            unsubscribe = emitter.onMatch("*", listener)

        it "listens to the first event correctly", ->
            publisher.publish("event1")

            listener.should.have.been.calledOnce
            listener.calledWith("event");

        it "listens to the second event correctly", ->
            publisher.publish("event2")

            listener.should.have.been.calledOnce
            listener.calledWith("event2");

        it "listens to the third event correctly", ->
            publisher.publish("event3")

            listener.should.have.been.calledOnce
            listener.calledWith("event3");

        it "listens to the fourth event correctly", ->
            publisher.publish("event4")

            listener.should.have.been.calledOnce
            listener.calledWith("event4");

    describe "when 'event*' is used to subscribed to events", ->
        events = ["event1", "event2", "event3", "Event4"]
        listener = null
        unsubscribe = null

        beforeEach ->
            listener = sinon.spy()
            unsubscribe = emitter.onMatch("event*", listener)

        it "listens to the first event correctly", ->
            publisher.publish("event1")

            listener.should.have.been.calledOnce
            listener.calledWith("event1");

        it "listens to the second event correctly", ->
            publisher.publish("event2")

            listener.should.have.been.calledOnce
            listener.calledWith("event2");

        it "listens to the third event correctly", ->
            publisher.publish("event3")

            listener.should.have.been.calledOnce
            listener.calledWith("event3");

        it "correctly does not listen to the fourth event", ->
            publisher.publish("Event4")

            listener.should.not.have.been.called

    describe "when a RegExp is used to subscribed to events", ->
        events = ["event1", "event2", "event3", "Event4"]
        listener = null
        unsubscribe = null

        beforeEach ->
            listener = sinon.spy()
            unsubscribe = emitter.onMatch(/^e.*[2,3]$/, listener)

        it "correctly does not listen to the first event", ->
            publisher.publish("event1")

            listener.should.not.have.been.called

        it "listens to the second event correctly", ->
            publisher.publish("event2")

            listener.should.have.been.calledOnce
            listener.calledWith("event2");

        it "listens to the third event correctly", ->
            publisher.publish("event3")

            listener.should.have.been.calledOnce
            listener.calledWith("event3");

        it "correctly does not listen to the fourth event", ->
            publisher.publish("Event4")

            listener.should.not.have.been.called

        it "should not call the listener when publishing after unsubscribing from the event", ->
            unsubscribe()
            publisher.publish("event3")

            listener.should.not.have.been.called
