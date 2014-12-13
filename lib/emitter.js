"use strict";

function isHash(unknown) {
    return typeof unknown === "object" && unknown !== null;
}

function escapeMetaCharacters(re) {
    "\\^$.|?*+()[{".split("").forEach(function (char) {
        re = re.replace(new RegExp("\\" + char, "g"), "\\" + char);
    });
    return re;
}

// Converts a wildcard string to a RegExp escaping "metacharacters".
// ex: "*" becomes "^.*$"
//     "ui.*" becomes "^ui\..*$"
function wildStringToRegExp(wildStr) {
    var startsWild = "";
    var endsWild = "";
    if (wildStr[0] === "*") { // Starts with a `*`?
        startsWild = ".*";
        wildStr = wildStr.substr(1);
    }
    if (wildStr[wildStr.length-1] === "*") { // Ends with a `*`?
        endsWild = ".*";
        wildStr = wildStr.substr(0, wildStr.length-1);
    }
    var r = "^" + startsWild + escapeMetaCharacters(wildStr) + endsWild + "$";
    return new RegExp(r);
}

var SEPARATOR = " ";

module.exports = function emitter(normalListeners, oneTimeListeners, matchListeners, regExpHash, events) {

    function subscribeSingleListener(eventName, listener, listeners) {
        if (!listeners.has(eventName)) {
            listeners.set(eventName, []);
        }

        listeners.get(eventName).push(listener);

        return function unsubscribe() {
            unsubscribeSingleListener(eventName, listener, listeners);
        };
    }

    function validateAndSubscribeSingleListener(eventName, listener, listeners) {
        if (events && events.indexOf(eventName) === -1) {
            throw new Error("Tried to subscribe to an unknown event \"" + eventName + "\".");
        }
        return subscribeSingleListener(eventName, listener, listeners);
    }

    function subscribeMultipleListeners(hash, listeners) {
        Object.keys(hash).forEach(function (eventName) {
            validateAndSubscribeSingleListener(eventName, hash[eventName], listeners);
        });
        return function unsubscribe() {
            unsubscribeMultipleListeners(hash, listeners);
        };
    }

    function unsubscribeSingleListener(eventName, listener, listeners) {
        var listenersArray = listeners.get(eventName, []);

        var index = listenersArray.indexOf(listener);
        if (index !== -1) {
            listenersArray.splice(index, 1);
        }
    }

    function unsubscribeMultipleListeners(hash, listeners) {
        Object.keys(hash).forEach(function (eventName) {
            unsubscribeSingleListener(eventName, hash[eventName], listeners);
        });
    }

    function unsubscribeAllListeners(eventName, listeners) {
        listeners.delete(eventName);
    }

    function onImpl(eventNameOrHash, listener, listeners) {
        if (listener === undefined) {
            if (!isHash(eventNameOrHash)) {
                throw new TypeError("hash argument must be a string-to-function hash.");
            }

            return subscribeMultipleListeners(eventNameOrHash, listeners);
        } else {
            if (typeof eventNameOrHash !== "string") {
                throw new TypeError("eventName argument must be a string.");
            }
            if (typeof listener !== "function") {
                throw new TypeError("listener argument must be a function.");
            }

            var unsubscribers = eventNameOrHash.split(SEPARATOR)
            .map(function (eventName) {
                return validateAndSubscribeSingleListener(eventName, listener, listeners);
            });

            return function unsubscribe() {
                unsubscribers.forEach(function (unsubscribe) {
                    unsubscribe();
                });
            };
        }
    }

    function once(eventNameOrHash, listener) {
        return onImpl(eventNameOrHash, listener, oneTimeListeners);
    }

    return {
        on: function (eventNameOrHash, listener) {
            return onImpl(eventNameOrHash, listener, normalListeners);
        },
        onNext: once,
        once: once,
        onMatch: function (eventPattern, listener) {
            var regExp;
            if (typeof eventPattern === "string") {
                regExp = wildStringToRegExp(eventPattern);
            } else if (eventPattern instanceof RegExp) {
                regExp = eventPattern;
            } else {
                throw new TypeError("eventPattern must be a string or a RegExp");
            }

            var key = regExp.toString(); // Save the RegExp.
            regExpHash[key] = regExp;

            return subscribeSingleListener(key, listener, matchListeners);
        },
        off: function (eventNameOrHash, listener) {
            if (typeof eventNameOrHash === "string") {
                if (typeof listener === "undefined") {
                    eventNameOrHash.split(SEPARATOR).forEach(function (eventName) {
                        unsubscribeAllListeners(eventName, normalListeners);
                        unsubscribeAllListeners(eventName, oneTimeListeners);
                    });
                } else if (typeof listener === "function") {
                    eventNameOrHash.split(SEPARATOR).forEach(function (eventName) {
                        unsubscribeSingleListener(eventName, listener, normalListeners);
                        unsubscribeSingleListener(eventName, listener, oneTimeListeners);
                    });
                } else {
                    throw new TypeError("listener argument must be a function.");
                }
            } else if (isHash(eventNameOrHash)) {
                unsubscribeMultipleListeners(eventNameOrHash, normalListeners);
                unsubscribeMultipleListeners(eventNameOrHash, oneTimeListeners);
            } else {
                if (arguments.length === 2) {
                    throw new TypeError("eventName argument must be a string.");
                } else {
                    throw new TypeError("eventNameOrHash argument must be a string or string-to-function hash.");
                }
            }
        }
    };
};
