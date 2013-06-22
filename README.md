# Keys.js

This project spawned out of a Chrome extension I was working on where I kept handling more and more key combinations for shortcut actions, until it eventually became an unmaintainable rats nest. Obviously I needed a solution, and Keys.js was born.

## Usage

This library is intended for use in the browser, but offers support for any CommonJS or AMD module loaders, such as require.js, etc.

## External Dependencies

None. I wanted to ensure that Keys could stand on it's own, independent of any third party libraries. This makes it really easy to deploy on an existing project.

## Architecture

Keys is composed of three classes that function a bit like a pyramid, starting with the smallest unit (Key) up to a document-wide event manager (Bindings).

#### Key

This class manages information about a single physical key on the keyboard. One can reference a given key instance using `Key.A` or `Key['Num Lock']`. There is little need to actually create new instances of Key as all of the keys on the keyboard already have static instances defined.

#### Combo

This class manages information about a combination of physical keys on the keyboard. Specifically, one physical key of any type, and any combination of the meta keys (SHIFT, ALT, META, etc). Combos are where we match the keys pressed in a keypress event to the keys required in Combos we wish to execute behavior against (as managed by the Bindings class).

You can create Combos easily using one of the following variations:

```
// Single meta key
var combo = new Combo(Key.A, Key.CTRL);
// Multiple meta keys, constructor called as a variadic function
var combo = new Combo(Key.A, Key.CTRL, Key.SHIFT);
// Multiple meta keys passed as an array
var combo = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
```

#### Bindings

This class manages the mapping of behavior to Combos. It intercepts keydown/keyup document-wide, creates a Combo from the keypress event, matches that Combo against the set of configured keybindings (instances of Combo), and if a match is found, executes any handlers for that Combo and event type (you can have distinct handlers for keydown/keyup). **Note:** You should only ever have one instance of Bindings on the page, or you will encounter duplication/dropping of events.

Bindings offers a simple API for taking Combos and binding behavior to them. First, you use `add` to create a keybinding:

```
var bindings = new Bindings();
bindings.add('displayAlert', new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]));
bindings.add('toggle', new Combo(Key.A, [ Key.CTRL, Key.META ]));
```

After you've added your keybindings, you can register a handler using `registerHandler`. You can register multiple handlers for a single event, they will all be executed.

```
bindings.registerHandler('displayAlert', function() { alert('Hello!'); });
```

If you have toggle-like behavior you'd like to implement, you are in luck! Register your toggle using `registerToggle`:

```
var toggleOn = function() { console.log('Lights on!'); };
var toggleOff = function() { console.log('Lights off!'); };
bindings.registerToggle('toggle', toggleOn, toggleOff);
```

**Note:** The toggle starts in the off position.



## Full Example

```
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

## TODO

I feel pretty happy with the current state of this, but as always, bugs and corner cases are sure to arise. A couple things I'd like to do:

- Full suite of tests
- Comprehensive documentation (good progress already)
- Discover additional use cases that aren't covered as well as they could be with Keys

## License

This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License.