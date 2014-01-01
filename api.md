---
layout: default
title: API
---

#### This documentation is a work in progress

**See the examples page for additional information**

## Architecture

Keys is composed of three classes that function a bit like a pyramid, starting with the smallest unit (Key) up to a document-wide event manager (Bindings).

#### Key

This class manages information about a single physical key on the keyboard. One can reference a given key instance using `Key.A` or `Key['Num Lock']`. There is little need to actually create new instances of Key as all of the keys on the keyboard already have static instances defined.

#### Combo

This class manages information about a combination of physical keys on the keyboard. Specifically, one physical key of any type, and any combination of the meta keys (SHIFT, ALT, META, etc). Combos are where we match the keys pressed in a keypress event to the keys required in Combos we wish to execute behavior against (as managed by the Bindings class).

You can create Combos easily using one of the following variations:

{% highlight javascript %}
// Single key
var combo = new Combo(Key.A);
// Single meta key
var combo = new Combo(Key.A, Key.CTRL);
// Multiple meta keys, constructor called as a variadic function
var combo = new Combo(Key.A, Key.CTRL, Key.SHIFT);
// Multiple meta keys passed as an array
var combo = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
{% endhighlight %}

#### Bindings

This class manages the mapping of behavior to Combos. It intercepts keypress/keydown/keyup document-wide, creates a Combo from that event, matches that Combo against the set of configured keybindings (instances of Combo), and if a match is found, executes any handlers for that Combo and event type (you can have distinct handlers for keydown/keyup). **Note:** You should only ever have one instance of Bindings on the page, or you will encounter duplication/dropping of events.

Bindings offers a simple API for taking Combos and binding behavior to them. First, you use `add` to create a keybinding:

{% highlight javascript %}
var bindings = new Bindings();
// Typical binding syntax
bindings.add('displayAlert', new Combo(Key.A, Key.CTRL, Key.SHIFT));
bindings.add('toggle', new Combo(Key.S, Key.CTRL, Key.META));
// Multiple bindings for one event
bindings.add('anotherEvent', new Combo(Key.D, Key.META), new Combo(Key.D, Key.SHIFT));
{% endhighlight %}

Add behavior to a binding using `Bindings.registerHandler`. You can also add multiple handlers for one event (for instance one handler for undo logic, one to perform the actual action).

{% highlight javascript %}
var displayAlert = function() { alert('Hello!'); };
// Inferred binding name and eventType syntax
bindings.registerHandler(displayAlert);
// Inferred eventType syntax
bindings.registerHandler('displayAlert', function(ev) { alert('Hello!'); });
// Full syntax
bindings.registerHandler('displayAlert', 'keypress', function(ev) { alert('Hello!'); });
{% endhighlight %}

You can unregister a handler using `Bindings.unregisterHandler`.

{% highlight javascript %}
// Unregister handler for a given name/function pair
bindings.unregisterHandler('displayAlert', displayAlert);
// Unregister handler for a specific event
bindings.unregisterHandler('keyup', 'displayAlert');
// Unregister all handlers with a given name
bindings.unregisterHandler('displayAlert');
{% endhighlight %}

If you have toggle-like behavior you'd like to implement, you are in luck! Register your toggle using `registerToggle`:

{% highlight javascript %}
var toggleOn = function() { console.log('Lights on!'); };
var toggleOff = function() { console.log('Lights off!'); };
bindings.registerToggle('toggle', toggleOn, toggleOff);
{% endhighlight %}

**Note:** The toggle starts in the off position.
