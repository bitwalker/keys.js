var vows   = require('vows'),
    assert = require('assert'),
    events = require('events'),
    Keys   = require('../src/keys');

var Key      = Keys.Key;
var Combo    = Keys.Combo;
var Bindings = Keys.Bindings;

vows.describe('Keys.js').addBatch({
    'Key': {
        'Key.fromName': {
            "with a valid name, returns the expected Key instance": function () {
                var key = Key.fromName('Num Lock');
                assert.isNotNull(key);
                assert.instanceOf(key, Key);
                assert.equal(key.name, 'Num Lock');
                assert.equal(key.code, 144);
                assert.isTrue(Key['Num Lock'].eq(key));
            },
            "with an invalid name, returns null": function() {
                var key = Key.fromName('gerg');
                assert.isNull(key);
            }
        },
        'Key.fromCode': {
            "with a valid code, returns the expected Key instance": function() {
                var key = Key.fromCode(144);
                assert.isNotNull(key);
                assert.instanceOf(key, Key);
                assert.equal(key.name, 'Num Lock');
                assert.equal(key.code, 144);
                assert.isTrue(Key['Num Lock'].eq(key));
            },
            "with an invalid code, returns null": function() {
                var key = Key.fromCode(-9999);
                assert.isNull(key);
            }
        },
        'Key.prototype.isPressed': {
            "if the provided code is the same as the Key's code, returns true": function() {
                assert.isTrue(Key['Num Lock'].isPressed(144));
            },
            "if the provided code is not the same as the Key's code, returns false": function() {
                assert.isFalse(Key['Num Lock'].isPressed(105));
            }
        },
        'Key.prototype.isMeta': {
            "if the current Key is a meta key, returns true": function() {
                assert.isTrue(Key.SHIFT.isMeta());
            },
            "if the current Key is not a meta key, returns false": function() {
                assert.isFalse(Key.A.isMeta());
            }
        },
        'Key.prototype.eq': {
            "if the current Key and the provided Key are the same Key, returns true": function() {
                var key = new Key('Num Lock', 144);
                var otherKey = Key['Num Lock'];
                assert.isTrue(otherKey.eq(key));
            },
            "if the current Key and the provided Key have the same code, but different names, returns false": function() {
                var key = new Key('Number Lock', 144);
                var otherKey = Key['Num Lock'];
                assert.isFalse(otherKey.eq(key));
            },
            "if the current Key and the provided Key are not the same Key, returns false": function() {
                assert.isFalse(Key.A.eq(Key.B));
            }
        }
    },


    'Combo': {
        'Creating Combos': {
            "cannot create a Combo with a non-meta Key unless it is the first argument of the constructor": function() {
                assert.throws(function() {
                    var combo = new Combo(Key.SHIFT, Key.CTRL, Key.A);
                }, Error);
                assert.throws(function() {
                    var combo = new Combo([ Key.SHIFT, Key.CTRL ], Key.A);
                }, Error);

                var combo = new Combo(Key.A, Key.SHIFT, Key.CTRL);
                assert.isNotNull(combo);
            },
            "cannot create a Combo with an empty constructor": function() {
                assert.throws(function() {
                    var combo = new Combo();
                }, Error);
            },
            "cannot create a Combo with a single key": function() {
                assert.throws(function() {
                    var combo = new Combo(Key.A);
                }, Error);
            },
            "cannot create a Combo with more than one non-meta key": function() {
                assert.throws(function() {
                    var combo = new Combo(Key.A, Key.B, Key.SHIFT);
                }, Error);
                assert.throws(function() {
                    var combo = new Combo(Key.A, [ Key.B, Key.SHIFT ]);
                }, Error);
            },
            "can create a Combo with any Key, and an array of meta Keys": function() {
                var combo = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
                assert.isNotNull(combo);
                assert.isTrue(Key.A.eq(combo.key));
                assert.isTrue(combo.ctrl);
                assert.isTrue(combo.shift);
                assert.isFalse(combo.alt);
                assert.isFalse(combo.meta);
            },
            "can create a Combo using variadic function syntax": function() {
                var combo = new Combo(Key.A, Key.ALT, Key.META);
                assert.isNotNull(combo);
                assert.isTrue(Key.A.eq(combo.key));
                assert.isTrue(combo.alt);
                assert.isTrue(combo.meta);
                assert.isFalse(combo.ctrl);
                assert.isFalse(combo.shift);
            }
        },
        'toString': {
            "calling toString on a Combo for Key.CTRL + Key.A returns 'CTRL+A'": function() {
                var combo = new Combo(Key.A, Key.ALT);
                assert.equal(combo.toString(), 'ALT+A');
            },
            "calling toString on a Combo for Key.CTRL + Key.ALT + Key.'Num Lock' returns 'CTRL+ALT+Num Lock'": function() {
                var combo = new Combo(Key['Num Lock'], Key.CTRL, Key.ALT);
                assert.equal(combo.toString(), 'CTRL+ALT+Num Lock');
            },
            "calling toString renders meta keys in the following order: CTRL, ALT, SHIFT, META": function() {
                var combo = new Combo(Key.A, [ Key.META, Key.ALT, Key.CTRL, Key.SHIFT ]);
                assert.equal(combo.toString(), 'CTRL+ALT+SHIFT+META+A');
            }
        },
        'Serialization': {
            "serializing a Combo results in a valid JSON string": function() {
                var expected = '{"key":{"name":"A","code":65},"ctrl":true,"shift":true,"alt":false,"meta":false}';
                var combo = new Combo(Key.A, Key.CTRL, Key.SHIFT);
                var result = combo.serialize();
                assert.isNotNull(result);
                assert.typeOf(result, 'string');
                assert.equal(result, expected);
            },
            "deserializing a valid JSON-encoded Combo results in a fully reified Combo object equal to the original": function() {
                var combo = new Combo(Key.A, Key.CTRL, Key.SHIFT);
                var serialized = combo.serialize();
                var result = Combo.deserialize(serialized);
                assert.isNotNull(result);
                assert.instanceOf(result, Combo);
                assert.isTrue(combo.eq(result));
            },
            "deserializing an empty JSON string returns null": function() {
                var result = Combo.deserialize('');
                assert.isNull(result);
            },
            "deserializing a non-Combo object using Combo.deserialize throws an Error": function() {
                assert.throws(function() {
                    var obj = JSON.stringify({ id: 5, test: 'string' });
                    var result = Combo.deserialize(obj);
                }, Error);
            },
            "deserializing an invalid Combo object (no meta keys set), throws an appropriate Error": function() {
                var combo = new Combo(Key.A, Key.SHIFT);
                // Quick serialize/deserialize to get an anonymous object
                var obj = JSON.parse(JSON.stringify(combo));
                // Reset shift to false
                obj.shift = false;
                // Re-serialize
                var serialized = JSON.stringify(obj);
                assert.throws(function() {
                    var result = Combo.deserialize(serialized);
                }, Error);
                try {
                    var result = Combo.deserialize(serialized);
                }
                catch(ex) {
                    assert.include(ex.message, 'Invalid Combo, at least one meta key should be set.');
                }
            }
        },
        'Combo.prototype.clone': {
            "cloning a Combo should produce a new instance of Combo that is equal to the original": function() {
                var combo  = new Combo(Key.A, Key.SHIFT, Key.META);
                var cloned = combo.clone();
                assert.isNotNull(cloned);
                assert.instanceOf(cloned, Combo);
                assert.isTrue(combo.eq(cloned));
            },
            "cloning a Combo should produce a deep clone" : function() {
                var combo = new Combo(Key.A, Key.SHIFT, Key.META);
                var cloned = combo.clone();
                assert.isNotNull(cloned);
                assert.isTrue(combo.eq(cloned));
                cloned.shift = false;
                assert.isFalse(combo.eq(cloned));
                assert.isTrue(combo.shift);
            }
        },
        'Combo.fromObject': {
            "Converting a valid Combo-like object returns a new Combo instance": function() {
                var combo = new Combo(Key.A, Key.SHIFT);
                // Quick serialize/deserialize to get an anonymous object
                var obj = JSON.parse(JSON.stringify(combo));
                var result = Combo.fromObject(obj);
                assert.isNotNull(result);
                assert.instanceOf(result, Combo);
                assert.isTrue(combo.eq(result));
            },
            "Converting an invalid object throws an Error": function() {
                var obj = { key: 5, shift: true, meta: true };
                assert.throws(function() {
                    var result = Combo.fromObject(obj);
                }, Error);
                try {
                    var result = Combo.fromObject(obj);
                } catch (ex) {
                    assert.include(ex.message, 'Invalid Combo object provided');
                }
            },
            "Converting an invalid Combo-like object throws an Error": function() {
                var combo = new Combo(Key.A, Key.SHIFT);
                // Quick serialize/deserialize to get an anonymous object
                var obj = JSON.parse(JSON.stringify(combo));
                obj.shift = false;
                assert.throws(function() {
                    var result = Combo.fromObject(obj);
                }, Error);
                try {
                    var result = Combo.fromObject(obj);
                } catch (ex) {
                    assert.include(ex.message, 'Invalid Combo, at least one meta key should be set');
                }
            }
        },
        'Combo.fromEvent': {
            "Converting a valid KeyboardEvent object returns a new Combo instance": function() {
                // Simulated KeyboardEvent
                var ev = {
                    which:    Key.A.code,
                    shiftKey: false,
                    altKey:   true,
                    metaKey:  true,
                    ctrlKey:  false
                };

                var combo = Combo.fromEvent(ev);
                var expected = new Combo(Key.A, Key.ALT, Key.META);

                assert.isNotNull(combo);
                assert.instanceOf(combo, Combo);
                assert.isTrue(expected.eq(combo));
            },
            "Converting a valid KeyboardEvent object that would result in an invalid Combo returns null": function() {
                // Simulated KeyboardEvent
                var ev = {
                    which:    Key.A.code,
                    shiftKey: false,
                    altKey:   false,
                    metaKey:  false,
                    ctrlKey:  false
                };

                var combo = Combo.fromEvent(ev);
                assert.isNull(combo);
            },
            "Converting a null or invalid KeyboardEvent object returns null": function() {
                var nulled  = Combo.fromEvent(null);
                // Missing meta key properties
                var invalid = Combo.fromEvent({ which: Key.A.code });
                assert.isNull(nulled);
                assert.isNull(invalid);
            }
        },
        'Combo.fromString': {
            "Converting a valid Combo string returns a new Combo instance": function() {
                var combo = new Combo(Key.A, Key.SHIFT);
                var str = combo.toString();
                var result = Combo.fromString(str);
                assert.isNotNull(result);
                assert.instanceOf(result, Combo);
                assert.isTrue(combo.eq(result));
            },
            "Converting a random string throws an Error": function() {
                assert.throws(function() {
                    Combo.fromString('stuff');
                }, Error);
                try { Combo.fromString('stuff'); }
                catch (ex) {
                    assert.include(ex.message, 'Invalid Combo string.');
                }
            },
            "Converting a Combo-like string, with not enough keys, throws an Error": function() {
                assert.throws(function() {
                    Combo.fromString('A');
                }, Error);
                try { Combo.fromString('A'); }
                catch (ex) {
                    assert.include(ex.message, 'Must have more than one key.');
                }
            },
            "Converting a Combo-like string, with more than one non-meta key, throws an Error": function() {
                assert.throws(function() {
                    Combo.fromString('A+Num Lock');
                }, Error);
                try { Combo.fromString('A+Num Lock'); }
                catch (ex) {
                    assert.include(ex.message, 'Cannot have more than one non-meta key.');
                }
            }
        },
        'Equality': {
            "Given two Combo instances for SHIFT+CTRL+A, eq returns true": function() {
                var first = new Combo(Key.A, Key.SHIFT, Key.CTRL);
                var second = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
                assert.isTrue(first.eq(second));
            },
            "Given two Combo instances for SHIFT+ALT, eq returns true": function() {
                var first = new Combo(Key.SHIFT, Key.ALT);
                var second = new Combo(Key.SHIFT, Key.ALT);
                assert.isTrue(first.eq(second));
            },
            "Given two Combo instances: SHIFT+ALT and ALT+SHIFT, eq returns false": function() {
                var first = new Combo(Key.SHIFT, Key.ALT);
                var second = new Combo(Key.ALT, Key.SHIFT);
                assert.isFalse(first.eq(second));
            },
            "Given two Combo instances: SHIFT+A and CTRL+A, eq returns false": function() {
                var first = new Combo(Key.A, Key.SHIFT);
                var second = new Combo(Key.A, Key.CTRL);
                assert.isFalse(first.eq(second));
            },
            "If the object provided to eq is not an instance of Combo, eq returns false": function() {
                var first = new Combo(Key.A, Key.SHIFT);
                assert.isFalse(first.eq(null));
                var comboLike = JSON.parse(JSON.stringify(first));
                assert.isFalse(first.eq(comboLike));
            },
            "Given two Combo instances for SHIFT+CTRL+A, isMatch returns true": function() {
                var first = new Combo(Key.A, Key.SHIFT, Key.CTRL);
                var second = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
                assert.isTrue(first.isMatch(second));
            },
            "Given two Combo instances for SHIFT+ALT, isMatch returns true": function() {
                var first = new Combo(Key.SHIFT, Key.ALT);
                var second = new Combo(Key.SHIFT, Key.ALT);
                assert.isTrue(first.isMatch(second));
            },
            "Given two Combo instances: SHIFT+ALT and ALT+SHIFT, isMatch returns true": function() {
                var first = new Combo(Key.SHIFT, Key.ALT);
                var second = new Combo(Key.ALT, Key.SHIFT);
                assert.isTrue(first.isMatch(second));
            },
            "Given two Combo instances: SHIFT+A and CTRL+A, isMatch returns false": function() {
                var first = new Combo(Key.A, Key.SHIFT);
                var second = new Combo(Key.A, Key.CTRL);
                assert.isFalse(first.isMatch(second));
            }
        },
        'Combo.prototype.metaKeys': {
            "When called, metaKeys returns an array of Key's which match that Combo's set of required meta keys": function() {
                var combo = new Combo(Key.A, Key.SHIFT, Key.META);
                var meta = combo.metaKeys();
                assert.isNotNull(meta);
                assert.lengthOf(meta, 2);
                assert.include(meta, Key.SHIFT);
                assert.include(meta, Key.META);
            }
        }
    },
    'Bindings': {
        'Integration Tests': {
            topic: function() {
                /**
                 * There is no document object in node so we are going to mock
                 * out document and the event listener implementation so that we 
                 * can test Bindings fully.
                 */
                if (!global.document) {
                    global.document = {
                        listeners: [],
                        addEventListener: function(eventType, fn, stopPropagation) {
                            this.listeners.push({
                                eventType: eventType,
                                handler:   fn
                            });
                        },
                        keyup: function(e) {
                            this.listeners.forEach(function(listener) {
                                if (listener.eventType === 'keyup')
                                    listener.handler.call(null, e);
                            });
                        },
                        keydown: function(e) {
                            this.listeners.forEach(function(listener) {
                                if (listener.eventType === 'keydown')
                                    listener.handler.call(null, e);
                            });
                        }
                    };
                }
                var bindings = new Bindings();
                return { document: global.document, bindings: bindings };
            },
            "Can add bindings": {
                topic: function(context) {
                    return context.bindings;
                },
                "It is possible to add a valid binding": function(bindings) {
                    var combo = new Combo(Key.A, [ Key.SHIFT, Key.CTRL ]);
                    bindings.add('testBind', combo);
                    assert.lengthOf(bindings.get('testBind').combos, 1);
                    assert.isTrue(bindings.get('testBind').combos[0].eq(combo));
                },
                "It is not possible to add a binding without a name": function(bindings) {
                    var combo = new Combo(Key.B, [ Key.SHIFT, Key.CTRL ]);
                    assert.throws(function() {
                        bindings.add(combo);
                    }, Error);
                    try { bindings.add(combo); }
                    catch (ex) { assert.include(ex.message, 'Invalid arguments'); }
                },
                "It is not possible to add a binding without a Combo": function(bindings) {
                    assert.throws(function() {
                        bindings.add('noCombo');
                    }, Error);
                    try { bindings.add('noCombo'); }
                    catch (ex) { assert.include(ex.message, 'Invalid arguments'); }
                },
                "Bindings.add validates that the combo provided is an instance of Combo": function(bindings) {
                    var combo = { key: Key.C, shift: true, ctrl: true, alt: false, meta: false };
                    assert.throws(function() {
                        bindings.add('comboLike', combo);
                    }, Error);
                    try { bindings.add('comboLike', combo); }
                    catch (ex) { assert.include(ex.message, 'must be an instance of Combo'); }
                },
                "Calling add with a name that already exists overwrites the Combo for that binding": function(bindings) {
                    assert.isNotNull(bindings.get('testBind'));
                    var combo = new Combo(Key.D, [ Key.SHIFT, Key.CTRL ]);
                    bindings.add('testBind', combo);
                    assert.lengthOf(bindings.get('testBind').combos, 1);
                    assert.isTrue(bindings.get('testBind').combos[0].eq(combo));
                }
            },
            "Can retrieve handlers for a given Combo": {
                topic: function(context) {
                    return context.bindings;
                },
                "After adding a binding, and registering a handler, it is possible to look up the handler given a Combo object": function(bindings) {
                    bindings.add('metaF', new Combo(Key.F, Key.META));
                    bindings.registerHandler('metaF', function() {
                        // Do stuff
                    });
                    var handler = bindings.getHandlersForCombo(new Combo(Key.F, Key.META));
                    assert.isNotNull(handler);
                    assert.lengthOf(handler, 1);
                    assert.equal(handler[0].name, 'metaF');
                    assert.equal(handler[0].eventType, 'keydown');
                }
            },
            "Serialization": {
                topic: function(context) {
                    return context.bindings;
                },
                "Can serialize the Bindings object": function(bindings) {
                    var serialized = bindings.serialize();
                    assert.isNotNull(serialized);
                    assert.typeOf(serialized, 'string');
                },
                "Can restore bindings from a serialized Bindings object with deserialize": function(bindings) {
                    // Add a test binding
                    bindings.add('serializable', new Combo(Key.S, Key.META, Key.SHIFT));
                    // Serialize
                    var serialized = bindings.serialize();
                    // Deserialize
                    bindings.deserialize(serialized);

                    // Find test binding and assert that everything is as expected
                    var serializable = find(bindings.bindings, function(b) { return b.name === 'serializable'; });
                    assert.isNotNull(serializable);
                    assert.equal(serializable.name, 'serializable');
                    assert.instanceOf(serializable.combos, Array);
                    assert.isTrue(serializable.combos.length > 0);
                    assert.instanceOf(serializable.combos[0], Combo);

                    function find(collection, predicate) {
                        for (var i = 0; i < collection.length; i++) {
                            if (predicate(collection[i]))
                                return collection[i];
                        }
                        return null;
                    }
                }
            },
            "Registering a handler with no eventType, defaults to keydown": {
                topic: function(context) {
                    var promise = new(events.EventEmitter);
                    context.bindings.add('shiftA', new Combo(Key.A, Key.SHIFT));
                    context.bindings.registerHandler('shiftA', function() {
                        promise.emit('success');
                    });
                    context.document.keydown({
                        which: Key.A.code,
                        shiftKey: true,
                        ctrlKey: false,
                        metaKey: false,
                        altKey: false,
                        stopImmediatePropagation: function() {}
                    });
                    return promise;
                },
                "The handler was successfully triggered": function(result, err) {}
            },
            "Registering a handler with a particular eventType will only be fired for events of that type": {
                topic: function(context) {
                    var promise = new(events.EventEmitter);
                    context.bindings.add('shiftB', new Combo(Key.B, Key.SHIFT));
                    context.bindings.registerHandler('shiftB', 'keyup', function() {
                        promise.emit('success');
                    });
                    context.bindings.registerHandler('shiftB', 'keydown', function() {
                        promise.emit('error');
                    });
                    context.document.keyup({
                        which: Key.B.code,
                        shiftKey: true,
                        ctrlKey: false,
                        metaKey: false,
                        altKey: false,
                        stopImmediatePropagation: function() {}
                    });
                    return promise;
                },
                "The handler was successfully triggered by the proper event type": function(result, err) {
                    assert.isTrue(typeof err === 'undefined' || err === null);
                }
            },
            "Can register a toggle": {
                topic: function(context) {
                    var promise = new(events.EventEmitter);
                    context.bindings.add('ctrlMetaA', new Combo(Key.A, Key.CTRL, Key.META));
                    /**
                     * Since toggles work by starting in the off state, we can test if it's
                     * successful by performing the following steps: 
                     * 
                     * 1. Set toggle to false to reflect the default state of 'off'
                     * 2. Trigger the toggle combo once, which fires the 'on' handler
                     * 2a. 'on' handler sets toggle to true, emits error if toggle is already true
                     * 3. Trigger the toggle combo again, which fires the 'off' handler
                     * 3a. 'off' handler sets toggle to false, emits error if toggle is already false
                     * 3b. 'off' handler increments toggles
                     * 3c. 'off' handler checks toggles count, if equal to 2, emits success
                     */
                    var toggle  = false; // off
                    var toggles = 0;
                    context.bindings.registerToggle('ctrlMetaA', function() {
                        // On
                        if (toggle) {
                            promise.emit('error');
                        }
                        toggle = true;
                    }, function() {
                        // Off
                        if (!toggle) {
                            promise.emit('error');
                        }
                        toggle = false;
                        toggles++;
                        if (toggles == 2) {
                            promise.emit('success');
                        }
                    });
                    var triggerToggle = function() {
                        context.document.keydown({
                            which: Key.A.code,
                            shiftKey: false,
                            ctrlKey: true,
                            metaKey: true,
                            altKey: false,
                            stopImmediatePropagation: function() {}
                        });
                    };
                    var executions = 2;
                    // Trigger the toggle twice for every number of executions we wish to perform
                    for (var i = 0; i < executions * 2; i++) {
                        triggerToggle();
                    }
                    return promise;
                },
                "Toggle was able to successfully toggle between it's two states as expected": function(result, err) {
                    assert.isTrue(typeof err === 'undefined' || err === null);
                }
            }
        }
    }
}).export(module);