/**
 * @author Paul Schoenfelder
 */
(function (root, builder, undefined) {
    if (typeof define === 'function' && define.amd) {
        // CommonJS AMD
        define(function() {
            return builder({}, root);
        });
    }
    else if (typeof module === 'object' && module.exports) {
        // CommonJS Native
        var globals = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
        module.exports = builder({}, globals);
    }
    else if (typeof exports === 'object') {
        var globals = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});
        exports = builder({}, globals);
    }
    else {
        // Vanilla environments (browser)
        root.Keys = builder({}, window);
    }
})(this, function (exports, globals, undefined) {
    'use strict';

    exports = exports || {};

    /**
     * Debugging flag. Set to true for verbose logging.
     *
     * @global
     * @static
     */
    exports.debug = false;

    /**
     * Determine if all of the provided object arguments are defined. Useful for argument
     * validation within functions.
     * 
     * @param {object} objects* - A variadic number of object arguments to check
     * @return {boolean}
     */
    function areDefined() {
        var objects = Array.prototype.slice.call(arguments);
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] !== null && typeof objects[i] === 'undefined')
                return false;
        }
        return true;
    }

    /**
     * Determine if the provided argument is an object
     * @param  {object}  obj
     * @return {Boolean}
     */
    function isObject(obj) {
        if (!obj || !obj.constructor || obj.constructor.name !== 'Object')
            return false;
        else return true;
    }

    /**
     * Determine if the provided argument is a function
     * @param  {Function} fn
     * @return {Boolean}
     */
    function isFunction(fn) {
        if (!fn || typeof fn !== 'function')
            return false;
        else return true;
    }

    /**
     *  Polyfills
     */
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(context) {
            var self = this;
            return function() {
                var args = Array.prototype.slice.call(arguments);
                return self.apply(context, args);
            };
        };
    }
    var bind = Function.prototype.bind;

    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (iterator, context) {
            if (!this)
                throw new Error('forEach: Array is null or undefined.');
            if (typeof iterator !== 'function')
                throw new Error('forEach: Iterator is not callable.');

            var len        = this.length >>> 0; // Force collection.length to int
            var index      = 0;
            context = context || null;
            while (index < len) {
                if (Object.prototype.hasOwnProperty.call(this, index)) {
                    var val = this[index];
                    iterator.call(context, val, index, this);
                }
                index++;
            }
        };
    }
    if (!Array.prototype.map) {
        Array.prototype.map = function (fn) {
            var results = [];
            this.forEach(function(element, index, all) {
                results.push(fn.call(null, element, index, all));
            });
            return results;
        };
    }
    if (!Array.prototype.filter) {
        Array.prototype.filter = function (predicate, context) {
            if (typeof predicate !== 'function')
                throw new Error("Predicate is not callable.");

            var results = [];
            this.forEach(function (element, index, all) {
                if (predicate.call(context, element, index, all))
                    results.push(element);
            });
            return results;
        };
    }
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            if (this === null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

    /**
     * Logging Functions
     */
    var log = (function() {
        // We call bind from the Function prototype like this because IE doesn't support console.log.bind
        var _log = console ? bind.call(console.log, console) : Function.prototype.valueOf();
        return function() {
            if (exports.debug) {
                var args = Array.prototype.slice.call(arguments);
                _log.apply(null, args);
            }
        };
    })();
    var warn = (function() {
        // We call bind from the Function prototype like this because IE doesn't support console.warn.bind
        var _warn = console ? bind.call(console.warn, console) : Function.prototype.valueOf();
        return function() {
            var args  = Array.prototype.slice.call(arguments);
            _warn.apply(null, args);
        };
    })();

    /**
     * Allows you to tap into the current set of elements without affecting them
     * in any way, additionally allowing you to chain calls together with this
     * in the middle for debugging
     *
     * @static
     * @param {array} collection - The array to tap
     * @param {function} fn - The function to call for each element the tap encounters
     * @param {boolean} debugOnly - If true, will only execute the tap fn if debug === true, defaults to false (always on)
     */
    function tap(collection, fn, debugOnly) {
        if (!debugOnly || exports.debug) {
            // Clone the original array to prevent tampering, and send each element to the tap
            collection.slice().forEach(function(element) { fn.call(null, element); });
        }
        return collection;
    }

    /**
     * Produces an array of arrays which are the result of zipping together the
     * elements of `this` and the array arguments. If any of the array arguments are
     * longer than `this`, their remaining elements will be skipped. If any of the array
     * arguments are shorter than `this`, their missing elements will be replaced with null.
     *
     * @static
     * @param {array} collection - The source array
     * @param {array} arrays* - A variadic number of arrays to be zipmapped
     */
    function zipmap(collection) {
        var arrays = Array.prototype.slice.call(arguments, 1);
        return collection.map(function(element, i) {
            var others = [];
            for (var j = 0; j < arrays.length; j++) {
                var el = arrays[j] && arrays[j][i];
                others.push(el !== null && typeof el !== 'undefined' ? el : null);
            }
            return [element].concat(others);
        });
    }

    /**
     * Determine if a string ends with the provided string.
     *
     * @memberof String
     * @instance
     * @param {string} str - The string to check
     * @param {string} ending - The string to match
     */
    function endsWith(str, ending) {
        if (str.length - ending.length === str.lastIndexOf(ending))
            return true;
        else return false;
    }

    /**
     * Search for the first element that matches a predicate within the collection
     * @param  {array} c - the collection to search
     * @param  {function} predicate - the predicate function to match with
     * @return {object} The first matching element or null if not found
     */
    function find (c, predicate) {
        for (var i = 0; i < c.length; i++) {
            if (predicate(c[i]))
                return c[i];
        }
        return null;
    }

    /**
     * Constructs a new instance of Key from a name and a keycode
     * @class Key
     * @classdesc Key represents the mapping between a physical key's name and it's machine code.
     *            It contains static references to all known keys, e.x. `Key.A` - and allows you
     *            to map a name or key code to one of those static instances.
     * @param {string} name - The name of the key
     * @param {number} code - The key code for the key
     */
    function Key(name, code) {
        this.name = name;
        this.code = code;

        // If a new Key is instantiated with a name that isn't
        // in the internal keymap, make sure we add it
        Key.internals.keymap[name] = Key.internals.keymap[name] || code;
    }

    /**
     * The raw map of key names to key codes. Used internally for some operations.
     * @memberOf Key
     * @name keymap
     * @type {object}
     * @static
     */
    Key.internals = {};
    Key.internals.keymap = {
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'Numpad 0': 96,
        'Numpad 1': 97,
        'Numpad 2': 98,
        'Numpad 3': 99,
        'Numpad 4': 100,
        'Numpad 5': 101,
        'Numpad 6': 102,
        'Numpad 7': 103,
        'Numpad 8': 104,
        'Numpad 9': 105,
        'Multiply': 106,
        'Add': 107,
        'Subtract': 109,
        'Decimal': 110,
        'Divide': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F11': 122,
        'F12': 123,
        'F13': 124,
        'F14': 125,
        'F15': 126,
        'Backspace': 8,
        'Tab': 9,
        'Enter': 13,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'META': 91,
        'META_RIGHT': 93,
        'Caps Lock': 20,
        'Esc': 27,
        'Spacebar': 32,
        'Page Up': 33,
        'Page Down': 34,
        'End': 35,
        'Home': 36,
        'Left': 37,
        'Up': 38,
        'Right': 39,
        'Down': 40,
        'Insert': 45,
        'Delete': 46,
        'Num Lock': 144,
        'ScrLk': 145,
        'Pause/Break': 19,
        '; :': 186,
        '= +': 187,
        ',': 188,
        '- _': 189,
        '.': 190,
        '/ ?': 191,
        '` ~': 192,
        '[ {': 219,
        '\\ |': 220,
        '] }': 221,
        '" \'': 222
    };

    // Transform the internal keymap to actual static Key instances
    for (var name in Key.internals.keymap) {
        Key[name] = new Key(name, Key.internals.keymap[name]);
    }

    /**
     * A static collection of all the meta key instances
     *
     * @memberOf Key
     * @type {Array}
     * @static
     */
    Key.metaKeys = [ Key.CTRL, Key.ALT, Key.SHIFT, Key.META ];

    /**
     * Retreive a Key instance associated with the provided name
     *
     * @memberOf Key
     * @static
     * @param  {string} name - The name of the key as can be found in the keymap
     * @return {Key}
     */
    Key.fromName = function(name) {
        var result = Key[name];
        if (result && result instanceof Key) {
            return result;
        }
        else {
            // Fallback to manual iteration in case the key name is the wrong case
            for (var keyName in Key.internals.keymap) {
                if (keyName.toLowerCase() === name.toLowerCase()) {
                    // Only return a non-null value if it is an instance of Key
                    return Key[keyName] instanceof Key ? Key[keyName] : null;
                }
            }
        }
        return null;
    };

    /**
     * Retrieve a Key instance associated with the provided key code
     * @param  {number} code - The key code as can be found in the keymap
     * @return {Key}
     */
    Key.fromCode = function(code) {
        for (var name in Key.internals.keymap) {
            if (Key.internals.keymap[name] === code)
                return Key[name];
        }
        return null;
    };

    /**
     * Retreive a Key instance from a KeyboardEvent
     * @param  {KeyboardEvent} e
     * @return {Key}
     */
    Key.fromEvent = function(e) {
        return Key.fromCode(e.which);
    };

    /**
     * Determine if the provided key code was pressed
     *
     * @memberOf Key
     * @instance
     * @param  {number} code - The key code from e.which
     * @return {boolean}
     */
    Key.prototype.isPressed = function(code) {
        return this.code === code;
    };

    /**
     * Return true if the current Key is a meta key
     *
     * @memberOf Key
     * @return {boolean} true if the Key is one of the meta keys
     */
    Key.prototype.isMeta = function() {
        switch (this.code) {
            case Key.CTRL.code:
            case Key.SHIFT.code:
            case Key.ALT.code:
            case Key.META.code:
            case Key.META_RIGHT.code:
                return true;
            default:
                return false;
        }
    };

    /**
     * Determine if two instances of Key are equal to each other.
     * @param  {Key} key
     * @return {boolean}
     */
    Key.prototype.eq = function(key) {
        return this.code === key.code && this.name === key.name;
    };

    exports.Key = Key;


    /**
     * Creates a new Combo from a key code and array of meta key codes
     * 
     * @class
     * @classdesc Combo represents the physical combination of a single key and any meta keys
     *            that ultimately are used to trigger a keybinding. It is at the Combo level
     *            that we match a configured keybinding with the current set of pressed keys.
     *
     * @example
     *  var combo = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
     * 
     * @namespace Combo
     * @constructor
     * @param {Key} key - The primary Key for this Combo.
     * @param {array} meta - An array of meta Keys needed for this Combo to be activated. {optional}
     */
    function Combo(key, meta) {
        var keys = null;
        if (arguments.length === 2 && meta instanceof Array) {
            keys = meta;
        }
        else if (arguments.length >= 2) {
            keys = Array.prototype.slice.call(arguments, 1);
        }
        else if (arguments.length === 1) {
            this.key   = key;
            this.ctrl  = key.eq(Key.CTRL);
            this.shift = key.eq(Key.SHIFT);
            this.alt   = key.eq(Key.ALT);
            this.meta  = key.eq(Key.META) || key.eq(Key.META_RIGHT);
            return;
        }
        else {
            throw new Error('Combo: Invalid number of arguments provided.');
        }

        var invalid = find(keys, function(k) {
            switch (k.code) {
                case Key.CTRL.code:
                case Key.SHIFT.code:
                case Key.ALT.code:
                case Key.META.code:
                case Key.META_RIGHT.code:
                    return false;
                default:
                    return true;
            }
        });

        if (invalid) {
            throw new Error('Combo: Attempted to create a Combo with multiple non-meta Keys. This is not supported.');
        }

        this.key   = key;
        this.ctrl  = hasKey(keys, Key.CTRL)  || key.eq(Key.CTRL);
        this.shift = hasKey(keys, Key.SHIFT) || key.eq(Key.SHIFT);
        this.alt   = hasKey(keys, Key.ALT)   || key.eq(Key.ALT);
        this.meta  = hasKey(keys, Key.META)  || hasKey(keys, Key.META_RIGHT);
        this.meta  = this.meta || (key.eq(Key.META) || key.eq(Key.META_RIGHT));

        function hasKey(collection, k) {
            return find(collection, function(x) { return k.eq(x); }) !== null;
        }
    }
    /**
     * Pretty print the Combo
     *
     * @memberOf Combo
     * @instance
     * @return {string} A string representation of the Combo
     */
    Combo.prototype.toString = function() {
        var meta = (this.ctrl  ? 'CTRL+'  : '') +
                   (this.alt   ? 'ALT+'   : '') +
                   (this.shift ? 'SHIFT+' : '') +
                   (this.meta  ? 'META+'  : '');
        if (this.key.isMeta())
            return endsWith(meta, '+') ? meta.slice(0, meta.length - 1) : meta;
        else return meta + (this.key && this.key.name ? this.key.name : '');
    };
    /**
     * Serialize the Combo for persistance or transport.
     *
     * @memberOf Combo
     * @instance
     * @return {string} The Combo as a JSON string
     */
    Combo.prototype.serialize = function() {
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not currently support JSON serialization.');
        return JSON.stringify(this);
    };
    /** 
     * Deserialize a Combo object from a JSON string.
     *
     * @memberOf Combo
     * @static
     * @param  {string} serialized - A serialized Combo object (JSON string)
     * @return {object} - The deserialized Combo as a regular object
     */
    Combo.deserialize = function(serialized) {
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not currently support JSON deserialization.');
        if (!serialized)
            return null;
        // Deserialize
        var parsed = JSON.parse(serialized);
        // Create an actual Combo instance from the deserialized form
        return Combo.fromObject(parsed);
    };
    /** 
     * Deep clone this Combo instance.
     *
     * @memberOf Combo
     * @instance
     * @return {Combo}
     */
    Combo.prototype.clone = function() {
        return Combo.fromObject({
            key:   this.key,
            ctrl:  this.ctrl,
            alt:   this.alt,
            shift: this.shift,
            meta:  this.meta
        });
    };

    /**
     * This function is reused across a number of Combo functions to
     * determine the meta Key instances to construct a new Combo instance
     * with.
     * 
     * @param  {array} flags - These flags, when present, must be in CTRL > ALT > SHIFT > META order.
     * @return {array} An array of Key instances matching the meta key flags passed in
     */
    function constructMetaParams(flags) {
        if (!flags || !(flags instanceof Array)) {
            flags = [ false, false, false, false ];
        }
        // Predicate to filter meta keys by
        var isActive   = function(m) { return m[1] === true; };
        // Extractor
        var extractKey = function(m) { return m[0]; };
        // Determine which meta keys were active, and map those to instances of Key
        return zipmap(Key.metaKeys, flags).filter(isActive).map(extractKey);
    }


    /**
     *  Create a Combo from an arbitrary object, primarily meant to be used in
     *  conjunction with Bindings.deserialize to properly reify a serialized Combo
     *  object. Called directly from Combo.deserialize for this reason as well.
     *
     *  @memberOf Combo
     *  @static
     *  @param {object} obj - The anonymous object to create a Combo instance from.
     *  @return {Combo}
     */
    Combo.fromObject = function(obj) {
        if (!obj || !obj.key || !obj.key.name || !obj.key.code)
            throw new Error('Combo.fromObject: Invalid Combo object provided.');


        // key param must be an instance of Key
        var key  = new Key(obj.key.name, obj.key.code);
        var meta = constructMetaParams([ obj.ctrl, obj.alt, obj.shift, obj.meta ]);
        if (meta.length)
            return new Combo(key, meta);
        else
            return new Combo(key);
    };
    /**
     * Given a keypress event, create a Combo that represents the set of pressed keys
     *
     * @memberOf Combo
     * @static
     * @param  {Event} e - The keypress event (could be keyup, keydown, or keypress)
     * @return {Combo}
     */
    Combo.fromEvent = function(e) {
        if (!e || !(e.which || e.keyCode))
            return null;

        var key = Key.fromCode(e.which || e.keyCode);
        if (!key)
            return null;

        var meta = constructMetaParams([ e.ctrlKey, e.altKey, e.shiftKey, e.metaKey ]);
        if (meta.length)
            return new Combo(key, meta);
        else
            return new Combo(key);
    };
    /**
     *  Reverse of toString, you should get the original combo if you call Combo.fromString(combo.toString()).
     *  Useful for converting text inputs with Combo.toString() populated values back into actual Combo
     *  objects.
     *  
     *  @memberOf Combo
     *  @static
     *  @param {string} str - A string which represents a valid Combo
     *  @return {Combo}
     */
    Combo.fromString = function(str) {
        var noEmpties = function(s) { return !s ? false : true; };
        var parts     = str.split('+').filter(noEmpties);
        var key       = Key.fromName(parts.length ? parts[parts.length - 1] : parts[0]);
        if (parts.length) {
            if (parts.length > 1) {
                var ctrlKey    = parts.indexOf('CTRL') > -1;
                var altKey     = parts.indexOf('ALT') > -1;
                var shiftKey   = parts.indexOf('SHIFT') > -1;
                var metaKey    = parts.indexOf('META') > -1 || parts.indexOf('META_RIGHT') > -1;
                // Construct parameters
                var meta      = constructMetaParams([ ctrlKey, altKey, shiftKey, metaKey ]);
                if (key && meta.length)
                    return new Combo(key, meta);
                else
                    throw new Error('Combo.fromString: Invalid Combo string, more than one non-meta key was specified.');
            }
            if (key) {
                return new Combo(key);
            }
        }

        throw new Error('Combo.fromString: Invalid Combo string.');
    };
    /**
     *  Determine if this Combo is exactly equivalent to another Combo
     *
     *  @memberOf Combo
     *  @instance
     *  @param {Combo} combo - The Combo to compare
     *  @return {boolean}
     */
    Combo.prototype.eq = function (combo) {
        if (!combo || !(combo instanceof Combo))
            return false;
        else if (!this.key.eq(combo.key))
            return false;
        else if (this.shift !== combo.shift)
            return false;
        else if (this.alt !== combo.alt)
            return false;
        else if (this.ctrl !== combo.ctrl)
            return false;
        else if (this.meta !== combo.meta)
            return false;
        else return true;
    };
    /**
     *  A looser version of equality checking. Whereas `eq` checks for strict value equality,
     *  `isMatch` checks for equality of intent. Does the user really care if the Combo is not
     *  strictly equal even if the same keys are pressed? No. `isMatch` is used when matching
     *  the Combo generated from a keypress event to Combos stored as keybindings, which might
     *  be equal in intent, but not equal in the strictest sense.
     *
     *  @memberOf Combo
     *  @instance
     *  @return {boolean}
     */
    Combo.prototype.isMatch = function (combo) {
        if (!combo && !(combo instanceof Combo))
            throw new Error('Combo.isMatch called with an invalid Combo object.');

        /** 
         * This is the difference in logic between eq and isMatch:
         * If we have a Combo: SHIFT+ALT, eq would return false
         * when comparing it to the Combo ALT+SHIFT, due to the primary
         * key being different, when from the users perspective those
         * are identical combinations. 
         * 
         * isMatch will infer the intent behind a meta-based combination
         * instead of blindly failing the comparison.
         */
        if (this.key.isMeta()) {
            if ((this.shift || this.key.eq(Key.SHIFT)) !== combo.shift)
                return false;
            if ((this.alt   || this.key.eq(Key.ALT))   !== combo.alt)
                return false;
            if ((this.ctrl  || this.key.eq(Key.CTRL))  !== combo.ctrl)
                return false;
            if ((this.meta  || this.key.eq(Key.META) || this.key.eq(Key.META_RIGHT)) !== combo.meta)
                return false;
        }
        else {
            return this.eq(combo);
        }

        return true;
    };
    /**
     * Get this Combo's meta keys as an array of Key instances
     *
     * @memberOf Combo
     * @instance
     * @return {array} An array of Key
     */
    Combo.prototype.metaKeys = function() {
        var flags = [
            this.ctrl  || this.key.eq(Key.CTRL),
            this.alt   || this.key.eq(Key.ALT),
            this.shift || this.key.eq(Key.SHIFT),
            this.meta  || this.key.eq(Key.META) || this.key.eq(Key.META_RIGHT)
        ];
        return constructMetaParams(flags);
    };

    exports.Combo = Combo;

    /**
     * Creates a new instance of the Bindings manager
     * 
     * @class
     * @classdesc Bindings is responsible for managing the mapping of behavior to Combos. In addition,
     *            it is responsible for listening in on keyup/keydown/keypress events document-wide, and if a
     *            Combo is matched, execute any associated handlers while also preventing the default
     *            behavior. It allows for persistance or transport by serializing the bindings currently
     *            managed, **but not the handlers**. Deserializing an instance of Bindings requires you
     *            to re-register all handlers.
     * @example
     *   // Toggle variable
     *   var toggled = false;
     *
     *   // Initialize manager
     *   var bindings = new Bindings();
     *
     *   bindings.add('displayAlert', new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]));
     *   bindings.add('toggleFlag', 'Optional description text.', new Combo(Key.F, [ Key.CTRL, Key.META ]));
     *
     *   // Map behavior to the displayAlert
     *   bindings.registerHandler('displayAlert', function() { alert('Hello!'); });
     *
     *   // Map behavior to the toggleFlag binding
     *   var toggleOn  = function() { toggled = true; };
     *   var toggleOff = function() { toggled = false; };
     *   bindings.registerToggle('toggleFlag', toggleOn, toggleOff);
     *
     *   See `examples/example.html` for a live demonstration of these concepts.
     *
     * @namespace Bindings
     * @constructor
     */
    function Bindings() {
        this.bindings = [];
        this.handlers = [];

        this.enable();
    }

    /**
     * The core logic that executes for every input event.
     * @param  {Event} e - An instance of Event specific to the input type
     */
    Bindings.prototype.onInputEvent = function (e) {
        var combo = Combo.fromEvent(e);
        if (!combo)
            return;

        // Gather event handlers
        var eventHandlers = this.getHandlersForCombo(combo)
                                .filter(validateHandler);
        // Log them
        tap(eventHandlers, debug, true /* only tap if Keys.debug == true */);
        // If this event has handled, we will prevent the default behavior for this input event
        var isHandled = eventHandlers.length > 0;
        // Execute them

        eventHandlers.forEach(function (h) {
            h.handler.call(null, e); // pass along the event to the handler
        });

        if (isHandled) {
            e.preventDefault();
            return false;
        }

        // A handler is valid if it handles the current event type and is either a global handler, 
        // or the current context is valid for a non-global handler
        function validateHandler (h) {
            return h.eventType === e.type && (h.isGlobal || isValidContext());
        }
        // Determine if this is a valid context for non-global handlers to execute (essentially not within any non-input element)
        function isValidContext() {
            if (e.target && e.target.nodeName) {
                var name = e.target.nodeName.toLowerCase();
                return [
                    'input'    === name,
                    'textarea' === name,
                    'select'   === name
                ].indexOf(true) === -1;
            }
            return true;
        }
        function debug(h) {
            log('Bindings.handleEvent called for Combo: ' + combo.toString() + '. Handler `' + h.name + '` was called.');
        }
        function execute(h) {
            h.handler.call(null);
        }
    };

    /**
     * Re-enable Keys.js or a specific binding or bindings,
     * depending on the number of arguments. None will re-enable
     * Key.js if it is currently matched. One or more will re-enable
     * each of the bindings matched by the names provided.
     *
     * @memberOf Bindings
     * @instance
     * @param {string} bindingNames* - One or more binding names to re-enable
     */
    Bindings.prototype.enable = function() {
        var self = this;

        var bindingNames = Array.prototype.slice.call(arguments);

        // If no arguments are provided, we're re-enabling Keys entirely
        if (!bindingNames.length) {
            var onInputEvent = this.onInputEvent.bind(this);
            // IE<9 doesn't have addEventListener
            if (typeof globals.document.addEventListener !== 'undefined') {
                globals.document.addEventListener('keydown',  onInputEvent, false);
                globals.document.addEventListener('keyup',    onInputEvent, false);
                globals.document.addEventListener('keypress', onInputEvent, false);
            }
            else {
                globals.document.attachEvent('onkeydown',  onInputEvent);
                globals.document.attachEvent('onkeyup',    onInputEvent);
                globals.document.attachEvent('onkeypress', onInputEvent);
            }
            this.bindings.forEach(function(binding) {
                binding.enabled = true;
            });
        }
        // Otherwise we only care about specific bindings
        else {
            bindingNames.forEach(function(name) {
                if (name && typeof name === 'string') {
                    self.bindings.forEach(function(binding) {
                        if (binding.name === name) {
                            binding.enabled = true;
                        }
                    });
                }
            });
        }


    };

    /**
     * Disable Keys.js or a specific binding or bindings,
     * depending on the number of arguments. None will disable
     * Key.js if it is currently disabled. One or more will disable
     * each of the bindings matched by the names provided.
     *
     * @memberOf Bindings
     * @instance
     * @param {string} bindingNames* - One or more binding names to disable
     */
    Bindings.prototype.disable = function() {
        var self = this;

        var bindingNames = Array.prototype.slice.call(arguments);

        // If no arguments are provided, we're disabling Keys entirely
        if (!bindingNames.length) {
            var onInputEvent = this.onInputEvent.bind(this);
            // IE<9 doesn't have addEventListener
            if (typeof globals.document.removeEventListener !== 'undefined') {
                globals.document.removeEventListener('keydown',  onInputEvent, false);
                globals.document.removeEventListener('keyup',    onInputEvent, false);
                globals.document.removeEventListener('keypress', onInputEvent, false);
            }
            else {
                globals.document.detachEvent('onkeydown',  onInputEvent);
                globals.document.detachEvent('onkeyup',    onInputEvent);
                globals.document.detachEvent('onkeypress', onInputEvent);
            }
            this.bindings.forEach(function(binding) {
                binding.enabled = false;
            });
        }
        // Otherwise we only care about specific bindings
        else {
            bindingNames.forEach(function(name) {
                if (name && typeof name === 'string') {
                    self.bindings.forEach(function(binding) {
                        if (binding.name === name) {
                            binding.enabled = false;
                        }
                    });
                }
            });
        }
    };

    /**
     * Fetches a binding by it's name.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} name - Name of the binding
     * @return {object} The binding, if found, otherwise null
     */
    Bindings.prototype.get = function(name) {
        return find(this.bindings, function(b) { return b.name === name; });
    };

    /**
     * Load allows you to add all of your applications bindings and event handlers
     * using a "bindings specification" object
     *
     * @param  {object} specs - The bindings specification
     * @example
     *     function displayAlert() { alert('Hello!'); }
     *
     *     bindings.load({
     *         // Simplest example
     *         displayAlert: {
     *             // `description` is an optional attribute, in case you wish to programmatically
     *             // list bindings in your application's UI. Just use description instead of the
     *             // less UI-friendly binding name!
     *             description: 'Displays an alert dialog.',
     *             bind: new Combo(Key.A, Key.SHIFT),
     *             handler: displayAlert,
     *             isGlobal: true // optional
     *         },
     *         // Customize eventType
     *         doStuff: {
     *             bind: new Combo(Key.A, Key.CTRL, Key.SHIFT),
     *             eventType: 'keyup',
     *             handler: doStuff
     *         },
     *         // Multiple binds
     *         logActivity: {
     *             bind: [ Key.L, new Combo(Key.L, Key.SHIFT) ],
     *             handler: function () { console.log('gerg'); }
     *         }
     *     });
     */
    Bindings.prototype.load = function(specs) {
        var self = this;
        if (!isObject(specs))
            throw new Error('Bindings.load: `specs` must be an object.');

        for (var key in specs) {
            if (Object.prototype.hasOwnProperty.call(specs, key)) {
                var invalidWarning = 'Bindings.load: The specs object provided contains an invalid binding specification `' + key + '` - ';

                if (!isObject(specs[key]))
                    warn(invalidWarning + 'invalid value type.');
                else {
                    var bindingName = key;
                    var desc        = specs[key].description || '';
                    var bind        = specs[key].bind;
                    var handler     = specs[key].handler;
                    var eventType   = specs[key].eventType;
                    var isGlobal    = specs[key].isGlobal || false;

                    // A binding spec is not valid if bind and handler are not defined
                    if (!areDefined(bind, handler)) {
                        warn(invalidWarning + 'requires definition of bind or handler.');
                    }
                    else if (!isFunction(handler)) {
                        warn(invalidWarning + 'handler must be a function.');
                    }
                    else if (!(bind instanceof Array || bind instanceof Combo || bind instanceof Key)) {
                        warn(invalidWarning + 'bind must be an instance of Array, Combo, or Key');
                    }
                    else {
                        // Add the binding
                        var addArgs = [ bindingName, desc ].concat(bind);
                        self.add.apply(self, addArgs);
                        // Register the handler
                        if (eventType) {
                            self.registerHandler.call(self, bindingName, eventType, handler, isGlobal);
                        }
                        else {
                            self.registerHandler.call(self, bindingName, handler, isGlobal);
                        }
                    }
                }
            }
        }
    };

    /**
     * Adds a new binding.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} name        - The name of the binding.
     * @param  {string} description - A description of the binding's purpose (optional)
     * @param  {Combo} combos       - One or more Keys or Combos which trigger this binding
     */
    Bindings.prototype.add = function(name, description /*, combo1, ..comboN */) {
        var combos = [];
        // For simplicity
        var desc   = description && typeof description === 'string' ? description : '';
        // If description is a function, then we know it was not provided
        if (description && typeof description !== 'string')
            combos = Array.prototype.slice.call(arguments, 1);
        else
            combos = Array.prototype.slice.call(arguments, 2);

        var validArgCount = desc ? arguments.length < 3 : arguments.length < 2;
        if (validArgCount || !name || !combos.length)
            throw new Error('Keybindings.add: Invalid arguments provided');
        // Validate combos
        combos.forEach(function(combo) {
            if (!(combo instanceof Combo || combo instanceof Key))
                throw new Error('Keybindings.add: `combo` must be an instance of Key or Combo');
        });

        // If the binding name already exists, overwrite it
        var binding = find(this.bindings, function(b) { return b.name === name; });
        if (binding) {
            // If no description was provided, leave the previous value alone
            if (desc) {
                binding.description = desc;
            }
            binding.combos = combos;
            log('Bindings.add: Updated existing binding - `' + name + '` with ' + combos.length + ' combos');
        } else {
            this.bindings.push({
                name:        name,
                description: desc,
                combos:      combos,
                enabled:     true
            });
            log('Bindings.add: New binding - `' + name + '` with ' + combos.length + ' combos');
        }
    };

    /**
     * Register a handler for when a Combo is executed.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} bindingName - The name of the binding to watch, is optional when handler is a named function.
     * @param  {string} eventType   - (optional) Either keyup or keydown, depending on needs. Defaults to keydown.
     * @param  {function} handler   - The function to call when the Combo is executed.
     * @param  {Boolean} isGlobal   - (optional) True to execute the handler regardless of context, false to prevent execution when in the context of an input control. Defaults to false.
     * @example
     *      function displayAlert() { alert('Hello!'); }
     *      // Full specification syntax
     *      bindings.registerHandler('displayAlert', 'keyup', function() { alert('Hello!'); }, true);
     *      // Partial specification, inferred eventType
     *      bindings.registerHandler('displayAlert', function() { alert('Hello!'); }, true);
     *      // Partial specification, inferred bindingName (must use named function)
     *      bindings.registerHandler('keyup', displayAlert, true);
     *      // Partial specification, inferred eventType and bindingName
     *      bindings.registerHandler(displayAlert, true);
     *      // Minimal specification, inferred eventType and bindingName, isGlobal defaults to false
     *      bindings.registerHandler(displayAlert);
     */
    Bindings.prototype.registerHandler = function(bindingName, eventType, handler, isGlobal) {
        // registerHandler(displayAlert)
        if (arguments.length === 1 && typeof bindingName === 'function') {
            handler     = bindingName;
            bindingName = handler.name;
            eventType   = 'keydown';
        }
        // registerHandler(displayAlert, true)
        if (arguments.length === 2 && typeof bindingName === 'function') {
            handler     = bindingName;
            bindingName = handler.name;
            isGlobal    = eventType || false;
            eventType   = 'keydown';
        }
        // registerHandler('keyup', displayAlert) or registerHandler('showAlert', function() { .. });
        else if (arguments.length === 2 && typeof eventType === 'function') {
            // Inferred bindingName
            if (bindingName === 'keyup' || bindingName === 'keydown' || bindingName === 'keypress') {
                handler     = eventType;
                eventType   = bindingName;
                bindingName = handler.name;
            }
            // Inferred eventType
            else {
                handler   = eventType;
                eventType = 'keydown';
            }
        }
        // registerHandler('displayAlert', function() { .. }, true|false) or registerHandler('keyup', displayAlert, true|false)
        else if (arguments.length === 3 && typeof eventType === 'function') {
            // Inferred bindingName
            if (bindingName === 'keyup' || bindingName === 'keydown' || bindingName === 'keypress') {
                isGlobal    = handler || false;
                handler     = eventType;
                eventType   = bindingName;
                bindingName = handler.name;
            }
            // Inferred eventType
            else {
                isGlobal  = handler || false;
                handler   = eventType;
                eventType = 'keydown';
            }
        }

        // Only possibilities left are invalid invocation or everything was fully specified.
        if (!bindingName || !eventType || !handler || typeof handler !== 'function')
            throw new Error('Bindings.registerHandler: Invalid arguments provided');
        if (bindingName === 'anonymous')
            throw new Error('Bindings.registerHandler: The function handler provided was anonymous when it needs to be named (in order to infer the binding name)');

        if (!this.get(bindingName)) {
            warn('Bindings.registerHandler: You have registered a handler for `' + bindingName + '`, but that binding as not yet been added.');
        }

        this.handlers.push({
            name:      bindingName,
            eventType: eventType,
            handler:   handler,
            isGlobal:  isGlobal || false
        });
        log('Bindings.registerHandler: Handler `' + bindingName + '` ' + (isGlobal ? 'globally' : '') + ' registered for `' + eventType + '` events.');
    };


    /**
     * Unregister a handler for for a combo
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} bindingName - The name of the binding to unregister
     * @param  {string} eventType   - (optional) Either keyup or keydown, depending on needs
     * @param  {function} handler   - The function to call when the Combo is executed.
     * @param  {Boolean} isGlobal   - (optional) True to execute the handler regardless of context, false to prevent execution when in the context of an input control. Defaults to false.
     * @example
     *      function displayAlert() { alert('Hello!'); }
     *      bindings.unregisterHandler('displayAlert', displayAlert);
     *      // unregister displayAlert handler with that function
     *      bindings.unregisterHandler('keyup', 'displayAlert');
     *      // unregister all handlers with this name
     *      bindings.unregisterHandler('displayAlert');
     */
    Bindings.prototype.unregisterHandler = function(bindingName, eventType, handler, isGlobal) {
        var matches = [];
      
        // unregisterHandler(displayAlert)
        if (arguments.length === 1 && typeof bindingName === 'function') {
            handler     = bindingName;
            bindingName = handler.name;
            eventType   = 'keydown';
            
            this.handlers.forEach(function(handler) {
                if (handler.name === bindingName && handler.handler == handler) matches.push(handler);
            });
            
        }
        else if (arguments.length === 1 && typeof bindingName === 'string') {
            this.handlers.forEach(function(handler) {
                if (handler.name === bindingName) matches.push(handler);
            });
        }
        
        // unregisterHandler(displayAlert, true)
        if (arguments.length === 2 && typeof bindingName === 'function') {
            handler     = bindingName;
            bindingName = handler.name;
            isGlobal    = eventType || false;
            eventType   = 'keydown';
            
            this.handlers.forEach(function(handler) {
                if ((handler.name === bindingName) && (handler.eventType == eventType) && (handler.handler == handler) && (handler.isGlobal == (isGlobal || false))) {
                  matches.push(handler);
                }
            });
        }
        // unregisterHandler('keyup', displayAlert) or registerHandler('showAlert', function() { .. });
        else if (arguments.length === 2 && typeof eventType === 'function') {
            // Inferred bindingName
            if (bindingName === 'keyup' || bindingName === 'keydown' || bindingName === 'keypress') {
                handler     = eventType;
                eventType   = bindingName;
                bindingName = handler.name;
            }
            // Inferred eventType
            else {
                handler   = eventType;
                eventType = 'keydown';
            }
            this.handlers.forEach(function(handler) {
                if ((handler.name === bindingName) && (handler.eventType == eventType) && (handler.handler.name == handler.name) && (handler.isGlobal == (isGlobal || false))) {
                  matches.push(handler);
                }
            });
            
        }
        // registerHandler('displayAlert', function() { .. }, true|false) or registerHandler('keyup', displayAlert, true|false)
        else if (arguments.length === 3 && typeof eventType === 'function') {
            // Inferred bindingName
            if (bindingName === 'keyup' || bindingName === 'keydown' || bindingName === 'keypress') {
                isGlobal    = handler || false;
                handler     = eventType;
                eventType   = bindingName;
                bindingName = handler.name;
            }
            // Inferred eventType
            else {
                isGlobal  = handler || false;
                handler   = eventType;
                eventType = 'keydown';
            }
            this.handlers.forEach(function(handler) {
                if ((handler.name === bindingName) && (handler.eventType === eventType) && (handler.handler.name === handler.name) && (handler.isGlobal === (isGlobal || false))) {
                  matches.push(handler);
                }
            });
        }
        
        else if (arguments.length === 3 && typeof handler === 'function') {
          this.handlers.forEach(function(handler) {
              if ( (handler.name === bindingName) && (handler.eventType === eventType) && (handler.handler.name === handler.name) ) {
                matches.push(handler);
              }
          });
        }

        var found;
        var _this = this;
        
        matches.forEach(function(handler) {
          _this.handlers.splice(_this.handlers.indexOf(handler), 1);
          log('Bindings.registerHandler: Handler `' + handler.name + '` ' + (handler.isGlobal ? 'globally' : '') + ' unregistered for `' + handler.eventType + '` events.');
        });
        
        return (matches.length > 0);
    };
    
    
    

    /**
     * For easier initialization, allow binding a group of handlers at one time using object notation
     *
     * @memberOf Bindings
     * @instance
     * @param {object|array} handlers - Either an object defining the handlers to register, using the schema shown in the example,
     *                                  or an array of named functions, which will all use either 'keydown' or the provided default
     *                                  eventType.
     * @param {string} eventType - The default eventType to use for handlers provided {optional}
     * @example
     *      function displayAlert() { alert('Hello!'); }
     *      function logEvent() { console.log('logEvent triggered!'); }
     *      // Object notation
     *      bindings.registerHandlers({
     *          displayAlert: {
     *              eventType: 'keyup',
     *              handler:   displayAlert,
     *              isGlobal:  true
     *          },
     *          logEvent: logEvent
     *      });
     *      // Array notation
     *      bindings.registerHandlers([ displayAlert, logEvent ]);
     *      // Array notation with default eventType
     *      bindings.registerHandlers([ displayAlert, logEvent ], 'keyup');
     */
    Bindings.prototype.registerHandlers = function(handlers, eventType) {
        var self = this;
        if (arguments.length > 2 || arguments.length === 0)
            throw new Error('Bindings.registerHandlers: Bad invocation. Incorrect # of arguments provided.');

        if (arguments.length === 2) {
            if (typeof eventType !== 'string')
                throw new Error('Bindings.registerHandlers: Bad invocation. eventType must be a string (keyup|keydown).');
        }

        // Array syntax
        if (handlers instanceof Array) {
            handlers.forEach(function(handler) {
                if (!handler.name || handler.name === 'anonymous')
                    throw new Error('Bindings.registerHandlers: Array notation with anonymous functions is not allowed.');
                if (eventType)
                    self.registerHandler(eventType, handler);
                else
                    self.registerHandler(handler);
            });
        }
        else if (typeof handlers === 'object') {
            for (var key in handlers) {
                if (handlers.hasOwnProperty(key)) {
                    var bindingName = key;
                    var handler     = handlers[key];
                    if (typeof handler === 'function') {
                        self.registerHandler(bindingName, handler);
                    }
                    else if (typeof handler === 'object') {
                        var evType   = handler.eventType || eventType;
                        var fn       = handler.handler;
                        var isGlobal = handler.isGlobal || false;
                        if (!fn || typeof fn !== 'function')
                            throw new Error('Bindings.registerHandlers: Invalid handler specification, must define the handler property as a function.');
                        if (evType) {
                            self.registerHandler(bindingName, evType, fn, isGlobal);
                        }
                        else {
                            self.registerHandler(bindingName, fn, isGlobal);
                        }
                    }
                }
            }
        }
    };

    /**
     * Register a toggle for when a Combo is executed.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} bindingName - The name of the binding to watch
     * @param  {function} toggleOn  - The function to execute when toggling on
     * @param  {function} toggleOff - The function to execute when toggling off
     * @param  {Boolean} isGlobal   - (optional) True to execute the toggle regardless of context, false to prevent execution when in the context of an input control. Defaults to false.
     */
    Bindings.prototype.registerToggle = function(bindingName, toggleOn, toggleOff, isGlobal) {
        if (arguments.length < 3) {
            throw new Error('Keybindings.registerToggle: Missing arguments.');
        }

        this.handlers.push({
            name: bindingName,
            eventType: 'keydown',
            isGlobal: isGlobal || false,
            // Wrap the toggle handlers in a closure that allows us 
            // to track the current state of the toggle, and call
            // the appropriate toggle handler. Assumes 'off' state
            // by default.
            handler: (function() {
                var on = false;
                return function() {
                    var args = Array.prototype.slice.call(arguments);
                    if (on) {
                        on = false;
                        toggleOff.apply(null, args);
                    } else {
                        on = true;
                        toggleOn.apply(null, args);
                    }
                };
            })()
        });
        log('Bindings.registerToggle: Toggle `' + bindingName + '` ' + (isGlobal ? 'globally' : '') + ' registered.');
    };

    /**
     * Serialize the current set of bindings (not the handlers)
     *
     * @memberOf Bindings
     * @instance
     * @return {string} - The Bindings instance as a JSON encoded string
     */
    Bindings.prototype.serialize = function() {
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not support JSON serialization.');
        return JSON.stringify(this);
    };

    /**
     * Deserialize a set of bindings into the current Bindings instance
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} serialized - The JSON object to deserialize
     */
    Bindings.prototype.deserialize = function(serialized) {
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not support JSON serialization.');

        var parsed = JSON.parse(serialized);
        if (!parsed || !parsed.bindings || parsed instanceof Array)
            throw new Error('Keybindings.deserialize: Unable to deserialize keybindings');

        // Deserialize bindings
        var mapped = parsed.bindings.map(function(b) {
            b.combos = b.combos.map(function(c) {
                if (typeof c.code !== 'undefined')
                    return new Key(c.name, c.code);
                else
                    return Combo.fromObject(c);
            });
            return b;
        });
        this.bindings = mapped;
    };

    /**
     * Gets the set of handlers for the given Combo
     *
     * @memberOf Bindings
     * @instance
     * @param {Combo} combo - The Combo to match handlers to.
     */
    Bindings.prototype.getHandlersForCombo = function(combo) {
        var self     = this;
        var matching = this.bindings.filter(function(binding) {
            return binding.enabled && any(binding.combos, function(c) {
                if (c instanceof Key)
                    return combo.key.eq(c);
                else
                    return c.isMatch(combo);
            });
        });
        return this.handlers.filter(function(handler) {
            return find(matching, function(b) {
                return b.name === handler.name;
            });
        });

        function any(collection, predicate) {
            for (var i = 0; i < collection.length; i++) {
                if (predicate(collection[i]))
                    return true;
            }
            return false;
        }
    };

    exports.Bindings = Bindings;

    return exports;

});
