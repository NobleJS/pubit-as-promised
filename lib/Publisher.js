"use strict";

var Q = require("q");
var dict = require("dict");
var emitter = require("./emitter");

function normalizeOptions(options) {
    if (typeof options !== "object" || options === null) {
        throw new TypeError("options argument must be an object or array of events.");
    }

    if (Array.isArray(options)) {
        options = { events: options };
    }

    if (options.onListenerError === undefined) {
        options.onListenerError = function (error) {
            process.nextTick(function () {
                throw error;
            });
        };
    }

    if (typeof options.onListenerError !== "function") {
        throw new TypeError("options.onListenerError must be an object.");
    }

    if (options.events !== undefined && !Array.isArray(options.events)) {
        throw new TypeError("options.events must be an array.");
    }

    return options;
}

var slice = Function.prototype.call.bind(Array.prototype.slice);

module.exports = function Publisher(options) {
    var that = this;

    var normalListeners = dict();
    var oneTimeListeners = dict();
    var matchListeners = dict();
    var regExpHash = {};

    if (options === undefined) {
        options = {};
    }
    options = normalizeOptions(options);

    function callListenersForSync(callListener, args, listeners) {
        var values = [];
        listeners.forEach(function (listener) {
            values.push(callListener(listener, args));
        });
        return values;
    }

    function callListenersForAsync(callListener, args, listeners) {
        process.nextTick(function () {
            callListenersForSync(callListener, args, listeners);
        });
    }

    function publishCommon(callListener, callListenersFor, eventName) {
        if (typeof eventName !== "string") {
            throw new TypeError("eventName argument must be a string.");
        }
        if (options.events && options.events.indexOf(eventName) === -1) {
            throw new Error("Tried to publish an unknown event \"" + eventName + "\".");
        }

        var args = slice(arguments, 3);
        var listeners = [];

        // .slice() is important to deal with self-unsubscribing listeners
        if (normalListeners.has(eventName)) {
            listeners = listeners.concat(normalListeners.get(eventName).slice());
        }
        if (oneTimeListeners.has(eventName)) {
            listeners = listeners.concat(oneTimeListeners.get(eventName).slice());
            oneTimeListeners.delete(eventName);
        }
        // Loop through all unique patterns, testing eventName again the RegExp pattern. 
        // Once fond, the inner loop binds each function, adding the eventName parameter.
        matchListeners.forEach(function (matchListeners, key) {
            if (eventName.match(regExpHash[key])) {
                matchListeners.forEach(function (matchListener) {
                    listeners.push(matchListener.bind(null, eventName)); // A matchListener is expecting the event name.
                });
            }
        });
        return callListenersFor(callListener, args, listeners);
    }

    that.publish = function () {
        function callListener(listener, args) {
            try {
                listener.apply(null, args);
            } catch (e) {
                options.onListenerError(e);
            }
        }
        var callListenersFor = options.async ? callListenersForAsync : callListenersForSync;
        var args = [callListener, callListenersFor].concat(slice(arguments, 0));
        publishCommon.apply(null, args);
    };

    that.publish.when = function () {
        function callListener(listener, args) {
            try {
                return Q.when(listener.apply(null, args));
            } catch (e) {
                return Q.reject(e);
            }
        }
        var args = [callListener, callListenersForSync].concat(slice(arguments, 0));
        var promises = publishCommon.apply(null, args);
        return Q.all(promises);
    };

    that.emitter = emitter(normalListeners, oneTimeListeners, matchListeners, regExpHash, options.events);
};
