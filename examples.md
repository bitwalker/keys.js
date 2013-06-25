---
layout: default
title: Examples
---

## Examples

#### Basic

[View Demo](examples/basic.html)

The following code demonstrates the most basic example of initializing Keys.js, adding a new binding, and defining behavior for that binding. It is assumed that for this, and all following examples, you have included the Keys.js script previously on the page.

{% highlight javascript %}
(function() {
    window.Bindings = Keys.Bindings;
    window.Combo    = Keys.Combo;
    window.Key      = Keys.Key;

    // Initialize application-wide bindings manager
    window.bindings = new Bindings();

    // Add binding to display an alert
    bindings.add('displayAlert', new Combo(Key.A, Key.SHIFT));

    // Register display alert behavior using inferred name/eventType notation
    bindings.registerHandler(displayAlert);
    /**
     *  If you want to use a specific eventType (default is 'keydown'):
    bindings.registerHandler('keyup', displayAlert);

     *  Or if you want to use a named function for a binding with a different name:
    bindings.registerHandler('sayHello', displayAlert);

     *  Or if you want to use an anonymous function for the handler:
    bindings.registerHandler('displayAlert', function() {
        alert('Hello!');
    });

     *  Or if you want to specify everything at once:
    bindings.registerHandler('displayAlert', 'keyup', displayAlert);

     */
    function displayAlert() {
        alert('Hello!');
    }
})();
{% endhighlight %}

#### Toggles

[View Demo](examples/toggles.html)

This code demonstrates how to configure a basic toggle with behavior. I'm using jQuery syntax for DOM manipulation here, but it is not required by Keys.js and the basic concepts don't change.

{% highlight javascript %}
(function() {
    window.Bindings = Keys.Bindings;
    window.Combo    = Keys.Combo;
    window.Key      = Keys.Key;

    // Initialize application-wide bindings manager
    window.bindings = new Bindings();

    // Add a binding to toggle the page background color
    bindings.add('toggleBackground', Key.B);

    /**
     * Register background color toggle behavior
     * Toggles always fire on 'keydown'
     */
    bindings.registerToggle('toggleBackground', toggleBlack, toggleWhite);
    function toggleBlack() {
        $('body').css('background-color', 'black');
        $('h1').css('color', 'white');
    }
    function toggleWhite() {
        $('body').css('background-color', 'white');
        $('h1').css('color', 'black');
    }
})();
{% endhighlight %}

#### Using Bindings.load

[View Demo](examples/using_load.html)

This code demonstrates how you can use `Bindings.load` to bulk define bindings and their behavior with one API call.

{% highlight javascript %}
(function() {
    window.Bindings = Keys.Bindings;
    window.Combo    = Keys.Combo;
    window.Key      = Keys.Key;

    // Initialize application-wide bindings manager
    window.bindings = new Bindings();

    bindings.load({
        displayAlert: {
            bind: new Combo(Key.A, Key.SHIFT),
            handler: function() {
                alert('Hello!');
            }
        },
        displayModal: {
            bind: new Combo(Key.M, Key.SHIFT),
            handler: displayModal
        },
        hideModal: {
            bind: new Combo(Key.X, Key.SHIFT),
            eventType: 'keypress',
            handler: hideModal
        }
    });

    function displayModal() {
        $('.modal').fadeIn('fast');
    }
    function hideModal() {
        $('.modal').fadeOut('fast');
    }
})();
{% endhighlight %}