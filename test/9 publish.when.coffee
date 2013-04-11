Publisher = require("..").Publisher
Q = require("q");

describe "Publish with `publish.when` (i.e. returns a promise)", ->
    publisher = null
    emitter = null
    listener55 = null
    listener66 = null
    error = new Error("bad")
    errorThrowingListener = -> throw error
    error2 = new Error("bad2")
    error2ThrowingListener = -> throw error2
    listenerAsync = null

    beforeEach ->
        listener55 = sinon.spy(-> 55)
        listener66 = sinon.spy(-> 66)
        publisher = new Publisher(["eventName"])
        emitter = publisher.emitter
        listenerAsync = sinon.spy(->
            deferred = Q.defer()
            setTimeout ->
                    deferred.resolve(55)
                , 1000
            
            return deferred.promise
        )
        #return Q.when(55).delay(1000);

    describe "having zero listeners", ->
        it "should return a promise that resolves to `[]`", (next) ->
            publisher.publish.when("eventName").done((arr) ->
                arr.should.have.length(0)
                next()
            )

    describe "having a single listener return `55`", ->
        it "should return a promise that resolves to `[55]`", (next) ->
            emitter.once("eventName", listener55)

            publisher.publish.when("eventName").done((arr) ->
                arr.should.have.length(1)
                arr[0].should.equal(55)
                next()
            )
            listener55.should.have.been.calledOnce

    describe "having a single listener return `55` after 1 second", ->
        it "should return a promise that resolves to `[55]`", (next) ->
            emitter.once("eventName", listenerAsync)

            publisher.publish.when("eventName").done((arr) ->
                arr.should.have.length(1)
                arr[0].should.equal(55)
                next()
            )

    describe "having a two listeners returning `55` and `66` respectively", ->
        it "should return a promise that resolves to `[55, 66]`", (next) ->
            emitter.once("eventName", listener55)
            emitter.once("eventName", listener66)

            publisher.publish.when("eventName").done((arr) ->
                arr.should.have.length(2)
                arr[0].should.equal(55)
                arr[1].should.equal(66)
                next()
            )
            listener55.should.have.been.calledOnce
            listener66.should.have.been.calledOnce

    describe "having a single listener thow an error", (next) ->
        it "should return a rejected promise", ->
            emitter.once("eventName", errorThrowingListener)

            publisher.publish.when("eventName").catch( (e) ->
                e.should.equal(error)
            ).done(next)

    describe "having two listeners both thowing an error", (next) ->
        it "should return a rejected promise from the first listener", ->
            emitter.once("eventName", errorThrowingListener)
            emitter.once("eventName", error2ThrowingListener)

            publisher.publish.when("eventName").catch( (e) ->
                e.should.equal(error)
            ).done(next)

    describe "having two listeners returning `55` and throwing an error respectively", ->
        it "should return [55] and a rejected promise", (next) ->
            emitter.once("eventName", listener55)
            emitter.once("eventName", errorThrowingListener)

            publisher.publish.when("eventName").catch( (e) ->
                e.should.equal(error)
                return
            ).done(next)

    describe "having a single listener return `55`", ->
        it "should return a promise that resolves to `[55]`", (next) ->
            emitter.once("eventName", -> 55)

            publisher.publish.when("eventName").done((arr) ->
                arr.should.have.length(1)
                arr[0].should.equal(55)
                next()
            )
