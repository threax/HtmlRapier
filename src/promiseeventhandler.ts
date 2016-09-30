
/**
 * This class provides a reusable way to fire events to multiple listeners and wait for them using
 * promises.
 */
export function PromiseEventHandler() {
    var handlers = [];

    function add(context, handler) {
        if (context === undefined) {
            throw "context cannot be undefined";
        }
        if (handler === undefined) {
            throw "handler cannot be undefined";
        }
        handlers.push({
            handler: handler,
            context: context
        });
    }

    function remove(context, handler) {
        for (var i = 0; i < handlers.length; ++i) {
            if (handlers[i].handler === handler && handlers[i].context === context) {
                handlers.splice(i--, 1);
            }
        }
    }

    this.modifier = {
        add: add,
        remove: remove
    }

    /**
     * Fire the event. The listeners can return values, if they do the values will be added
     * to an array that is returned by the promise returned by this function.
     * @returns {Promise} a promise that will resolve when all fired events resolve.
     */
    function fire() {
        var result;
        var promises = [];
        for (var i = 0; i < handlers.length; ++i) {
            var handlerObj = handlers[i];
            promises.push(new Promise(function (resovle, reject) {
                resovle(handlerObj.handler.apply(handlerObj.context, arguments));
            })
                .then(function (data) {
                    if (data !== undefined) {
                        if (result === undefined) {
                            result = [];
                        }
                        result.push(data);
                    }
                }));
        }

        return Promise.all(promises)
            .then(function (data) {
                return result;
            });
    }
    this.fire = fire;
}