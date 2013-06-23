# Keys.js

This project spawned out of a Chrome extension I was working on where I kept handling more and more key combinations for shortcut actions, until it eventually became an unmaintainable rats nest. Obviously I needed a solution, and Keys.js was born.

## Status

Stable, but it's a new project, so as always, caveat emptor. The documentation is very close to comprehensive, but some work needs to be done. The test suite is comprehensive, and very few gaps are left to fill there that are meaningful. Please help me identify any gaps in functionality, testing, or docs, by submitting issues so that I can prioritize things as needed. The current list of things I am working on is as follows:

- Implement locale selection, locale loading
- Implement Sequences (non-chord key combinations)
- Implement scoped bindings (only execute a binding if focus is within the scope of a given element)
- Comprehensive documentation (good progress already)
- Discover additional use cases that aren't covered as well as they could be
- Implement a faux-Vim example to demonstrate a complex usecase of keybindings in a web application.

## Features

- Bind behavior to a specific key or combination of keys, ex. `bindings.add('undo', Key.U)` or `bindings.add('undoAll', new Combo(Key.U, Key.META))`
- Bind behavior to multiple keys/combos with a single binding, ex. `bindings.add('auditEvent', Key.D, new Combo(Key.D, Key.META))`
- Handle bindings with a callback function using `Bindings.registerHandler`
- Handle bindings with toggle-style behavior using `Bindings.registerToggle(bindingName, toggleOnHandler, toggleOffHandler)`
- Work with objects, ex. `new Combo(Key.A, Key.CTRL)`, instead of strings, i.e `new Combo('ctrl+a')`. While slightly more verbose, it is less error prone, and allows you to catch errors early on if you spell a key wrong, or try to create a Combo with an invalid combination of keys.
- Save bindings to localStorage or send to a server for persistance using `Combo.serialize` or `Bindings.serialize`. Very useful for allowing users to customize their keybindings.
- Pretty print Combos using `Combo.toString`
- More to come!

#### Browser Support

I've tested in the following browsers:

- IE7+ (I suspect IE6 works, but I don't have a way to test)
- Firefox 21+
- Safari 6+
- Chrome 27+

#### Module Support

Key.js has CommonJS and AMD module support, and can be used with require.js or another module loader.

#### External Dependencies

None. I wanted to ensure that Keys could stand on it's own, independent of any third party libraries. This makes it really easy to deploy on an existing project. The only exception is in IE<7 where the JSON object is not provided. In this case, you would need to add the JSON2 library to your project. This is only necessary if you plan on making use of the serialization features that Keys.js provides.

#### Potential Side Effects

Key.js polyfills Array.forEach, Array.map, Array.filter and Array.indexOf **if they are not already implemented by the browser, or another library**, for internal use. I currently have no plans to remove these polyfills, but if it is causing issues for you, let me know and I'll look into alternative approaches. If you are curious, the decision to polyfill those methods was due to my opinion that the improvements in code clarity and maintainability make them worthwhile.

## Architecture

Keys is composed of three classes that function a bit like a pyramid, starting with the smallest unit (Key) up to a document-wide event manager (Bindings).

#### Key

This class manages information about a single physical key on the keyboard. One can reference a given key instance using `Key.A` or `Key['Num Lock']`. There is little need to actually create new instances of Key as all of the keys on the keyboard already have static instances defined.

#### Combo

This class manages information about a combination of physical keys on the keyboard. Specifically, one physical key of any type, and any combination of the meta keys (SHIFT, ALT, META, etc). Combos are where we match the keys pressed in a keypress event to the keys required in Combos we wish to execute behavior against (as managed by the Bindings class).

You can create Combos easily using one of the following variations:

```javascript
// Single key
var combo = new Combo(Key.A);
// Single meta key
var combo = new Combo(Key.A, Key.CTRL);
// Multiple meta keys, constructor called as a variadic function
var combo = new Combo(Key.A, Key.CTRL, Key.SHIFT);
// Multiple meta keys passed as an array
var combo = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
```

#### Bindings

This class manages the mapping of behavior to Combos. It intercepts keypress/keydown/keyup document-wide, creates a Combo from that event, matches that Combo against the set of configured keybindings (instances of Combo), and if a match is found, executes any handlers for that Combo and event type (you can have distinct handlers for keydown/keyup). **Note:** You should only ever have one instance of Bindings on the page, or you will encounter duplication/dropping of events.

Bindings offers a simple API for taking Combos and binding behavior to them. First, you use `add` to create a keybinding:

```javascript
var bindings = new Bindings();
// Typical binding syntax
bindings.add('displayAlert', new Combo(Key.A, Key.CTRL, Key.SHIFT));
bindings.add('toggle', new Combo(Key.S, Key.CTRL, Key.META));
// Multiple bindings for one event
bindings.add('anotherEvent', new Combo(Key.D, Key.META), new Combo(Key.D, Key.SHIFT));
```

Add behavior to a binding using `Bindings.registerHandler`. You can also add multiple handlers for one event (for instance one handler for undo logic, one to perform the actual action).

```javascript
var displayAlert = function() { alert('Hello!'); };
// Inferred binding name and eventType syntax
bindings.registerHandler(displayAlert);
// Inferred eventType syntax
bindings.registerHandler('displayAlert', function() { alert('Hello!'); });
// Full syntax
bindings.registerHandler('displayAlert', 'keypress', function() { alert('Hello!'); });
```

If you have toggle-like behavior you'd like to implement, you are in luck! Register your toggle using `registerToggle`:

```javascript
var toggleOn = function() { console.log('Lights on!'); };
var toggleOff = function() { console.log('Lights off!'); };
bindings.registerToggle('toggle', toggleOn, toggleOff);
```

**Note:** The toggle starts in the off position.



## Full Example

```html
<html>
<body>
    <div class="wrapper">
        <input type="text" id="test" placeholder="Test input.." />
    </div>
    <script type="text/javascript" src="../src/keys.js"></script>
    <script type="text/javascript">
        (function() {
            // Toggle Flag
        	var toggled = false;

            // Initialize application-wide bindings manager
        	var bindings = window.bindings = new Bindings();

            // Add keybindings
        	bindings.add('displayAlert',   new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]));
        	bindings.add('toggleFlag',     new Combo(Key.C, [ Key.SHIFT, Key.META ]));
            bindings.add('highlightInput', new Combo(Key.SHIFT, Key.META));

            // Register displayAlert handler
        	bindings.registerHandler('displayAlert', function() { alert('Hello!'); });

            // Register toggleFlag toggle
        	var toggleOn  = function() { toggled = true; console.log(toggled); };
        	var toggleOff = function() { toggled = false; console.log(toggled); };
        	bindings.registerToggle('toggleFlag', toggleOn, toggleOff);

            // Register a pair of handlers on keyup/keydown to highlight a field
            // while the associated Combo is activated (held down)
        	bindings.registerHandler('highlightInput', 'keydown', function() {
        		document.getElementById('test').style['background-color'] = 'yellow';
        	});
        	bindings.registerHandler('highlightInput', 'keyup', function() {
        		document.getElementById('test').style['background-color'] = 'white';
        	});
        })();
    </script>
</body>
</html>
```

## License

This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License.