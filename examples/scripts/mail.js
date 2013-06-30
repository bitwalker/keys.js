(function($, Mustache, Keys, undefined) {
    // Aliases for Keys.js objects
    var Bindings = Keys.Bindings, Combo = Keys.Combo, Key = Keys.Key;

    /**
     * Partially apply function arguments in advance
     * @param  {Function} fn
     * @param  {object}   context
     * @return {Function}
     */
    var partial = function(fn, context) {
        if (!fn || typeof fn !== 'function')
            throw new Error('Invalid function passed to `partial`.');

        var partialArgs = Array.prototype.slice.call(arguments, context ? 2 : 1);
        return function() {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(context ? context : null, partialArgs.concat(args));
        };
    };

    /**
     *  Curry allows you to compose two functions into one monolithic function.
     *  The arguments to the final function are applied from right to left.
     *  
     *  Example:
     *      curry(f, g)(2) => f(g(2))
     *
     *  @param {function} f - The outer function
     *  @param {function} g - The inner function
     */
    var curry = function(f, g) {
        if (f && g) {
            return function() {
                var args   = Array.prototype.slice(arguments);
                var result = g.apply(null, args);
                return f.apply(null, [ result ]);
            };
        }
        else throw new Error('Curry only accepts two functions.');
    };

    /**
     * Delay execution of a function by `ms` milliseconds.
     * @param  {Function} fn - The function to delay
     * @param  {[type]}   ms - The number of milliseconds to delay
     */
    var delay = function(fn, ms) {
        ms = ms || 100;
        var timeout = null;
        timeout = setTimeout(function() {
            fn.call(null);
            clearTimeout(timeout);
            timeout = null;
        }, ms);
    };

    /**
     * Defines an event handler for a jQuery event, but with your own context
     * The element target is captured as a jQuery object, and along with the event object,
     * the two are passed along as the first parameters to the handler. You can
     * partially apply arguments when calling eventHandler, and they will be passed
     * to the handler as arguments following the element and event object.
     * 
     * @param  {Function} fn      - event handler function
     * @param  {Object}   context - the context to use for `this` inside the handler
     * @returns {Function}
     */
    var eventHandler = function(fn, context) {
        var args = Array.prototype.slice.call(arguments, 2);
        return function(e) {
            var el = $(this);
            return fn.apply(context, [el, e].concat(args));
        };
    };

    /**
     * Determine if this string ends with the provided string
     * @param  {string} s The string to test for
     * @return {Boolean}
     */
    String.prototype.endsWith = function(s) {
        if (!s || typeof s !== 'string') return false;
        return this.indexOf(s) === this.length - s.length;
    };

    /**
     * Selects the first element from an array which has a value matching
     * the provided property/value pair, or if the property name is omitted,
     * the first element where the value matches the provided value.
     * @param  {string} prop
     * @param  {Object} value
     * @return {Object}
     */
    Array.prototype.pick = function(prop, value) {
        if (typeof prop === 'undefined' && typeof value === 'undefined') return null;
        if (typeof prop !== 'undefined' && typeof value === 'undefined') {
            value = prop;
            prop  = null;
        }
        for (var i = 0; i < this.length; i++) {
            var item = this[i];
            if (prop) {
                if (Object.prototype.hasOwnProperty.call(item, prop) && item[prop] === value) {
                    return item;
                }
            }
            else if (item === value) {
                return item;
            }
        }
        return null;
    };

    // Data Classes
    function SidebarItem(page, name, isActive) {
        this.name = name;
        // If the page and the section name are the same, drop it from the url
        if (page === name.toLowerCase())
            this.url = '#/' + page;
        else
            this.url = '#/' + page + '/' + name.toLowerCase();
        this.className = isActive ? 'active' : '';
    }

    function Email(from, labels, subject, received) {
        this.id         = generateId(8);
        this.from       = from;
        this.labels     = labels || [];
        this.subject    = subject;
        this.body       = loremIpsum();
        this.received   = received;
        // These flags represent special email states
        this.archived   = false;
        this.deleted    = false;
        this.isSpam     = this.hasLabel(Label.spam);

        // These flags represent the logical opposite of current state,
        // and are there primarily to provide Mustache with a way to render
        // conditional elements of related templates. This state is managed
        // entirely by the Email class.
        this.archivable = !this.archived && !this.deleted;
        this.deletable  = !this.deleted;
        this.markable   = !this.isSpam;

        function generateId(limit) {
            limit = limit || 32;
            var result = '';
            while (result.length < limit) {
                result = result + Math.random().toString(10).slice(2);
            }
            return result.slice(0, limit);
        }

        function loremIpsum() {
            return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit. Donec et mollis dolor. Praesent et diam eget libero egestas mattis sit amet vitae augue. Nam tincidunt congue enim, ut porta lorem lacinia consectetur. Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ut gravida lorem. Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt feugiat nisl imperdiet. Ut convallis libero in urna ultrices accumsan. Donec sed odio eros. Donec viverra mi quis quam pulvinar at malesuada arcu rhoncus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In rutrum accumsan ultricies. Mauris vitae nisi at sem facilisis semper ac in est.";
        }
    }
    Email.prototype.hasLabel = function(label) {
        for (var i = 0; i < this.labels.length; i++) {
            if (this.labels[i].eq(label))
                return true;
        }
        return false;
    };
    Email.prototype.addLabel = function(label) {
        if (!this.hasLabel(label)) {
            this.labels.push(label);
        }
    };
    Email.prototype.removeLabel = function(label) {
        this.labels = this.labels.filter(function(l) {
            return !l.eq(label);
        });
    };
    Email.prototype.trash = function() {
        if (this.deleted) {
            this.deleted = false;
            this.deletable = true;
            this.archived = false;
            this.archivable = true;
            this.removeLabel(Label.trash);
        }
        else {
            this.deleted = true;
            this.deletable = false;
            this.archived = false;
            this.archivable = false;
            this.addLabel(Label.trash);
        }
    };
    Email.prototype.archive = function() {
        if (this.archived) {
            this.archived = false;
            this.archivable = true;
        }
        else {
            this.archived = true;
            this.archivable = false;
        }
    };
    Email.prototype.markSpam = function() {
        if (this.hasLabel(Label.spam)) {
            this.removeLabel(Label.spam);
            this.markable = true;
            this.isSpam = false;
            if (this.deleted) {
                this.trash();
            }
        }
        else {
            this.addLabel(Label.spam);
            this.markable = false;
            this.isSpam = true;
            if (!this.deleted) {
                this.trash();
            }
        }
    };

    function Label(name, type) {
        this.name = name;
        this.type = type;
    }
    Label.prototype.eq = function(label) {
        if (label.name === this.name && label.type === this.type)
            return true;
        else return false;
    };
    // Static labels
    Label.important = new Label('Important', 'important');
    Label.friend    = new Label('Friend', 'info');
    Label.family    = new Label('Family', 'success');
    Label.work      = new Label('Work', 'default');
    Label.spam      = new Label('Spam', 'warning');
    Label.trash     = new Label('Trash', 'inverse');

    function Alert(message) {
        this.message = message;
    }

    var App = {

        // Defined in `init`
        routes: null,

        templates: {
            sidebar: null,
            alert: null,
            inbox: {
                view: null,
                email: null,
                readingPane: null
            },
            settings: {
                view: null,
                editBinding: null
            }
        },

        keybindings: new Bindings(),

        elements: {
            navInbox:       $('.nav .nav-inbox'),
            navSettings:    $('.nav .nav-settings'),
            query:          $('input.search-query'),
            sidebar:        $('.sidebar'),
            view:           $('.view')
        },

        state: {
            // If this is the first time the user has viewed the inbox,
            // show them the informational dialog explaining the application
            showWelcomePopup: true,
            inbox: {
                emails: [
                    new Email('Paul Schoenfelder', [ Label.friend ], 'Hey man, check this out!', '9:40 PM'),
                    new Email('Acme Company', [ Label.important, Label.work ], "We're going public!", '8:37 PM'),
                    new Email('Mom', [ Label.family ], "You haven't called in two weeks!!", '5:43 PM'),
                    new Email('Super Important Guy', [ Label.spam ], 'You really have to read this right away!', '5:00 PM')
                ],
                currentItemId: null
            },
            settings: {
                virtualKeyboard: {
                    metaKeys: [],
                    primaryKey: null
                }
            }
        },

        init: function() {
            var self = this;

            /**
             * Routes are defined as follows:
             * The key is the rule which will match location.hash when onhashchange is called. You can provide
             * variables in the form of regular expressions, which will be passed along to the route
             * handler as parameters in the order that they are found.
             * 
             * The value in the routes object is the route handler, and will be called so that `this`
             * is set to the App context. Use `partial` if you wish to partially apply route handler
             * arguments prior to the router applying it's own arguments when calling the handler.
             */
            this.routes = {
                'default':               this.showInbox,
                '#/inbox':               this.showInbox,
                '#/inbox/\\w+':          this.showInbox,
                '#/search/.+':           this.searchInbox,
                '#/settings':            this.showSettings
            };

            // Compile templates
            this.templates.sidebar                  = Mustache.compile($('#sidebar').html());
            this.templates.alert                    = Mustache.compile($('#alert').html());
            this.templates.inbox.view               = Mustache.compile($('#inbox').html());
            this.templates.inbox.email              = Mustache.compile($('#email').html());
            this.templates.inbox.readingPane        = Mustache.compile($('#reading-pane').html());
            this.templates.settings.view            = Mustache.compile($('#settings').html());
            this.templates.settings.editBinding     = Mustache.compile($('#edit-binding').html());

            // Handle hashchange for routing
            $(window).on('hashchange', function() { self.router(location.hash); });

            /**
             * Inbox Behavior
             */
            // Handle inbox search
            $('form.navbar-search').on('submit', eventHandler(this.onSearch, this));
            // Handle inbox item selection
            this.elements.view.on('click', '.email', eventHandler(this.onMailSelected, this));
            // Handle deletion
            this.elements.view.on('click', '.reading-pane .delete', eventHandler(this.onDeleteMail, this));
            // Handle archival
            this.elements.view.on('click', '.reading-pane .archive', eventHandler(this.onArchiveMail, this));
            // Handle mark as spam
            this.elements.view.on('click', '.reading-pane .spam', eventHandler(this.onMarkAsSpam, this));

            /**
             * Settings Behavior
             */
            // Open edit binding modal
            this.elements.view.on('click', '.edit-binding', eventHandler(this.onEditKeybinding, this));
            // Reset virtual keyboard state on cancel
            this.elements.view.on('click', '#editbinding button[data-dismiss]', eventHandler(this.onCancelEdit, this));
            // Reset binding selection during edit
            this.elements.view.on('click', '#editbinding button[data-reset]', eventHandler(this.onResetBinding, this));
            // Save binding selection during edit
            this.elements.view.on('click', '#editbinding button[data-save]', eventHandler(this.onSaveBinding, this));

            /**
             * Keyboard Shortcuts
             */
            // Configure bindings with default values
            this.keybindings.add('goToInbox',     'Navigation: Go To Inbox',     new Combo(Key.I, Key.SHIFT));
            this.keybindings.add('goToArchive',   'Navigation: Go To Archive',   new Combo(Key.A, Key.SHIFT));
            this.keybindings.add('goToTrash',     'Navigation: Go To Trash',     new Combo(Key.T, Key.SHIFT));
            this.keybindings.add('goToSettings',  'Navigation: Go To Settings',  new Combo(Key.S, Key.SHIFT));
            this.keybindings.add('moveUp',        'Inbox: Select Previous',      new Combo(Key.Up));
            this.keybindings.add('moveDown',      'Inbox: Select Next',          new Combo(Key.Down));
            this.keybindings.add('trash',         'Inbox: Send To Trash',        new Combo(Key.Backspace));
            this.keybindings.add('archive',       'Inbox: Send To Archive',      new Combo(Key.A, Key.CTRL));
            this.keybindings.add('spam',          'Inbox: Mark As Spam',         new Combo(Key.S, Key.CTRL));
            // Bind behavior to bindings
            this.keybindings.registerHandler('goToInbox',    partial(this.route, this, '#/inbox'));
            this.keybindings.registerHandler('goToArchive',  partial(this.route, this, '#/inbox/archived'));
            this.keybindings.registerHandler('goToTrash',    partial(this.route, this, '#/inbox/trash'));
            this.keybindings.registerHandler('goToSettings', partial(this.route, this, '#/settings'));
            this.keybindings.registerHandler('moveUp',       partial(this.selectPreviousItem, this));
            this.keybindings.registerHandler('moveDown',     partial(this.selectNextItem, this));
            this.keybindings.registerHandler('trash',        curry(partial(this.deleteMail, this),  partial(this.getCurrentItem, this)));
            this.keybindings.registerHandler('archive',      curry(partial(this.archiveMail, this), partial(this.getCurrentItem, this)));
            this.keybindings.registerHandler('spam',         curry(partial(this.markAsSpam, this),  partial(this.getCurrentItem, this)));

            this.refresh();
        },

        route: function(hash) {
            // Reset currently selected item
            this.state.inbox.currentItemId = null;
            // Route to new location
            window.location.hash = hash;
        },

        router: function(hash) {
            var self  = this;

            // Parse hash for a matching route
            var route = null;
            for (var rule in this.routes) {
                var rx = new RegExp('^' + rule + '$');
                if (rx.test(location.hash)) {
                    route = rule;
                    break;
                }
            }

            // The parameters to apply to the route handler
            var params      = [];
            // Parameters defined in the route
            var routeParams = route !== null ? route.split('/').slice(2) : [];
            // Parameters found in the actual hash
            var hashParams  = location.hash.split('/').slice(2);
            // Are there parameters to work with?
            var hasParams   = hashParams.length && routeParams.length;
            if (hasParams) {
                for (var i = 0; i < routeParams.length; i++) {
                    if (typeof hashParams[i] !== 'undefined') {
                        params.push(hashParams[i]);
                    }
                }
            }

            if (!route) {
                this.routes['default'].call(this);
            }
            else {
                this.routes[route].apply(this, params);
            }
        },

        refresh: function() {
            $(window).trigger('hashchange');
        },

        /**
         * Inbox Page
         */

        showInbox: function(inboxType) {
            if (!inboxType) inboxType = '';

            // Render Inbox
            var emails = this.getMail(inboxType);
            this.elements.view.html(this.templates.inbox.view(emails));

            // Show welcome popup
            if (this.state.showWelcomePopup) {
                this.showWelcome();
            }

            // Render sidebar
            this.renderSidebar({
                items: [
                    new SidebarItem('inbox', 'Inbox',    !inboxType),
                    new SidebarItem('inbox', 'Archived', inboxType === 'archived'),
                    new SidebarItem('inbox', 'Trash',    inboxType === 'trash')
                ]
            });

            // Change active nav item
            this.elements.navInbox.addClass('active');
            this.elements.navSettings.removeClass('active');
        },

        searchInbox: function(query) {
            // Render Inbox
            var emails = this.getMail(function(email) {
                return email.subject.indexOf(query) > -1 || email.body.indexOf(query) > -1 || email.from.indexOf(query) > -1;
            });
            this.elements.view.html(this.templates.inbox.view(emails));

            // Render sidebar
            this.renderSidebar({
                items: [
                    new SidebarItem('inbox', 'Inbox',    true),
                    new SidebarItem('inbox', 'Archived', false),
                    new SidebarItem('inbox', 'Trash',    false)
                ]
            });

            // Change active nav item
            this.elements.navInbox.addClass('active');
            this.elements.navSettings.removeClass('active');
        },

        onSearch: function(element, e) {
            e.preventDefault();
            this.state.inbox.currentItemId = null;
            var query = this.elements.query.val();
            location.hash = '#/search/' + encodeURIComponent(query);
            return false;
        },

        selectMail: function(id) {
            if (id) {
                this.state.inbox.currentItemId = id;
                $('tr.email[data-id="' + id + '"]').addClass('selected');
                this.readMail(id);
            }
        },

        selectNextItem: function() {
            if (this.state.inbox.currentItemId) {
                var current = $('tr.email[data-id="' + this.state.inbox.currentItemId + '"]');
                var next = current.next();
                if (next.length) {
                    current.removeClass('selected');
                    var id = next.data('id').toString();
                    this.selectMail(id);
                }
            }
            else {
                var id = $('tr.email').eq(0).data('id').toString();
                this.selectMail(id);
            }
        },

        selectPreviousItem: function() {
            if (this.state.inbox.currentItemId) {
                var current = $('tr.email[data-id="' + this.state.inbox.currentItemId + '"]');
                var previous = current.prev();
                if (previous.length) {
                    var id = previous.data('id').toString();
                    current.removeClass('selected');
                    this.selectMail(id);
                }
            }
            else {
                var id = $('tr.email').eq(0).data('id').toString();
                this.selectMail(id);
            }
        },

        getCurrentItem: function() {
            return this.state.inbox.currentItemId || -1;
        },

        onMailSelected: function(element, e) {
            var id = element.data('id').toString();
            this.selectMail(id);
        },

        onDeleteMail: function(element, e) {
            e.preventDefault();

            var id = element.data('id');
            this.deleteMail(id);

            return false;
        },

        deleteMail: function(id) {
            this.state.inbox.emails.forEach(function(email) {
                if (email.id == id) {
                    email.trash();
                }
            });
            this.state.inbox.currentItemId = null;
            this.refresh();
        },

        onArchiveMail: function(element, e) {
            e.preventDefault();

            var id = element.data('id');
            this.archiveMail(id);

            return false;
        },

        archiveMail: function(id) {
            this.state.inbox.emails.forEach(function(email) {
                if (email.id == id) {
                    email.archive();
                }
            });
            this.state.inbox.currentItemId = null;
            this.refresh();
        },

        onMarkAsSpam: function(element, e) {
            e.preventDefault();

            var id = element.data('id');
            this.markAsSpam(id);

            return false;
        },

        markAsSpam: function(id) {
            this.state.inbox.emails.forEach(function(email) {
                if (email.id == id) {
                    email.markSpam();
                }
            });
            this.state.inbox.currentItemId = null;
            this.refresh();
        },

        showWelcome: function() {
            this.state.showWelcomePopup = false;
            var welcome = 'Demo Mail is an entirely keyboard driven mail application. Menus can be navigated by mouse or keyboard. To get started, CTRL+SHIFT+K!';
            this.elements.view.prepend(this.templates.alert(new Alert(welcome)));
        },

        readMail: function(id) {
            var email = this.state.inbox.emails.filter(function(e) {
                if (e.id === id) return true;
                else return false;
            });
            if (email.length) {
                this.elements.view.find('#read').html(this.templates.inbox.readingPane(email[0]));
            }
        },

        getMail: function(filter, predicate) {
            if (typeof filter === 'function') {
                predicate = filter;
                filter = '';
            }
            return {
                emails: this.state.inbox.emails.filter(function(e) {
                    switch (filter) {
                        case 'archived':
                            return predicate ? e.archived && predicate(e) : e.archived === true;
                        case 'trash':
                            return predicate ? e.deleted && predicate(e) : e.deleted === true;
                        default:
                            var criteria = !e.archived && !e.deleted;
                            return predicate ? criteria && predicate(e) : criteria;
                    }
                })
            };
        },

        renderSidebar: function(data) {
            this.elements.sidebar.html(this.templates.sidebar(data));
        },

        /** 
         * Settings Page
         **/

        showSettings: function(settingsType) {
            // Render content
            var viewModel = {
                virtualKeyboard: this.state.settings.virtualKeyboard,
                categories: [
                    {
                        name: 'Navigation',
                        bindings: this.keybindings.bindings.filter(function(b) { return b.description.indexOf('Navigation:') > -1; }),
                        strippedDescription: function() {
                            return this.description.replace('Navigation: ', '');
                        }
                    },
                    {
                        name: 'Inbox',
                        bindings: this.keybindings.bindings.filter(function(b) { return b.description.indexOf('Inbox:') > -1; }),
                        strippedDescription: function() {
                            return this.description.replace('Inbox: ', '');
                        }
                    }
                ]
            };
            this.elements.view.html(this.templates.settings.view(viewModel));

            // Render sidebar
            this.renderSidebar({
                items: [
                    new SidebarItem('settings', 'Keybindings', true)
                ]
            });

            // Change active nav item
            this.elements.navSettings.addClass('active');
            this.elements.navInbox.removeClass('active');
        },

        onEditKeybinding: function(element, e) {
            e.preventDefault();

            var self = this;
            var bindingName = element.data('binding');
            var binding     = this.keybindings.get(bindingName);

            // Elements
            var modal    = null;
            var keyboard = null;
            var keys     = null;

            if (binding) {
                // Render modal to page
                this.elements.view.append(this.templates.settings.editBinding(binding));

                // Show modal
                modal    = this.elements.view.find('#editbinding');
                keyboard = modal.find('#keyboard');
                keys     = keyboard.find('li');
                // When the modal is hidden, refresh the page to capture data changes
                modal.on('hidden', function() {
                    // Unwire events
                    keys.off('click', activateKey);
                    // Destroy the modal once hidden
                    modal.remove();
                    self.refresh();
                });
                // Show the modal
                modal.modal();

                // Bind key activation events
                keys.on('click', eventHandler(activateKey, this));
                $(document).on('keydown', eventHandler(activateKey, this));

                // Activate current combo's keys
                this.elements.view.find('.current-binding').on('reactivate', function() {
                    var parts = $(this).text().split('+');
                    parts.forEach(function(keyName) {
                        var el = findKey(Key.fromName(keyName));
                        if (el) {
                            // Trigger the click event to piggyback on existing activation code
                            el.trigger('click');
                        }
                    });
                });
                this.elements.view.find('.current-binding').trigger('reactivate');
            }

            return false;


            /**
             * On a given click or keydown event, toggle the activated state of the targeted key
             * if valid, and add the key to the current combo state. If the key is not valid,
             * render a timed alert which tells the user why their selection was not valid and was
             * ignored.
             *
             * @param  {Event} e  - The click or keydown event object
             */
            function activateKey(element, e) {
                // The key object
                var key  = e.type === 'click'
                                  ? Key.fromName(extractKeyName(element))
                                  : Key.fromCode(e.which);
                // The key element
                var $key = e.type === 'click'
                                  ? element
                                  : findKey(key);

                if ($key && key) {
                    // If this key is already activated...
                    if ($key.hasClass('active')) {
                        if (key.isMeta()) {
                            // If this is a meta key, remove it from the selected meta keys
                            var filtered = this.state.settings.virtualKeyboard.metaKeys.filter(function(k){
                                if (k.eq(key)) {
                                    return false;
                                }
                                return true;
                            });
                            this.state.settings.virtualKeyboard.metaKeys = filtered || [];
                            // Highlight all instances of the same key
                            var others = findKey(key, true);
                            others.forEach(function($k) { $k.removeClass('active'); });
                        }
                        else {
                            // Otherwise, if this is the current primary key, set the primary key to null
                            if (this.state.settings.virtualKeyboard.primaryKey.eq(key)) {
                                this.state.settings.virtualKeyboard.primaryKey = null;
                            }
                            // Toggle active state
                            $key.removeClass('active');
                        }
                    }
                    else {
                        // If this is a meta key, add it to the selected meta keys
                        if (key.isMeta()) {
                            // Add key to current state
                            this.state.settings.virtualKeyboard.metaKeys.push(key);
                            // Highlight other instances of the same key (if meta)
                            var others = findKey(key, true);
                            others.forEach(function($k) { $k.addClass('active'); });
                        }
                        else {
                            // If the primaryKey has already been set, replace it, and deactivate the old one
                            if (this.state.settings.virtualKeyboard.primaryKey) {
                                var $old = findKey(this.state.settings.virtualKeyboard.primaryKey);
                                if ($old) {
                                    $old.removeClass('active');
                                }
                            }
                            this.state.settings.virtualKeyboard.primaryKey = key;
                            // Make active
                            $key.addClass('active');
                        }
                    }
                }

                // Update the current binding
                if (this.state.settings.virtualKeyboard.primaryKey) {
                    var combo = new Combo(this.state.settings.virtualKeyboard.primaryKey, this.state.settings.virtualKeyboard.metaKeys);
                    this.elements.view.find('.current-binding').text(combo.toString());
                }
                else if (this.state.settings.virtualKeyboard.metaKeys.length) {
                    var combo = this.state.settings.virtualKeyboard.metaKeys.map(function(k) {
                        return k.name;
                    }).join('+');
                    this.elements.view.find('.current-binding').text(combo);
                }
                else {
                    this.elements.view.find('.current-binding').text('');
                }

                if (key && Key.Backspace.eq(key)) {
                    e.preventDefault();
                    return false;
                }
            }

            /**
             * Finds a key (or keys) as elements on the virtual keyboard.
             * Setting `findAll` to true will return all keys that match
             * the name of the provided key, otherwise it will return the first
             * result.
             * @param  {Key} key         - A Key object describing the key to find
             * @param  {Boolean} findAll - True to find all instances of a key, false to find the first
             * @return {jQuery|array}    - The results of the search, either a single jQuery element, or an array of jQuery elements
             */
            function findKey(key, findAll) {
                // Results is used only if we're searching for all instances `findAll == true`
                var results = [];
                if (key) {
                    for (var i = 0; i < keys.length; i++) {
                        var $key   = $(keys[i]);
                        var found  = compareKey($key, key.name);
                        if (found) {
                            if (findAll) results.push(found);
                            else return found;
                        }
                    }
                }

                return findAll ? results : null;
            }

            /**
             * Compares the name of the key element to the provided key name. 
             * If it matches, return the key element, if it doesn't, return null
             * @param  {jQuery} $key - The key element
             * @param  {string} name - The name of the key we're looking for
             * @return {jQuery}      - If the comparison is true, returns $key, otherwise returns null
             */
            function compareKey($key, name) {
                var keyName = extractKeyName($key);
                if (keyName && name.toLowerCase() === keyName) {
                    return $key;
                }
                else return null;

                return null;
            }

            /**
             * Extracts the key name from the provided key element.
             * @param  {jQuery} $key - The key element
             * @return {string} The name of the key
             */
            function extractKeyName($key) {
                if ($key) {
                    if ($key.hasClass('symbol')) {
                        var span = $key.find('span.off');
                        return span && span.text();
                    }
                    else {
                        return $key.text();
                    }
                }
                else {
                    return null;
                }
            }
        },

        onCancelEdit: function(element, e) {
            // Reset virtual keyboard state
            this.state.settings.virtualKeyboard.primaryKey = null;
            this.state.settings.virtualKeyboard.metaKeys   = [];
        },

        onResetBinding: function(element, e) {
            var bindingName    = element.data('reset');
            var currentBinding = this.elements.view.find('.current-binding');
            var defaultBinding = this.keybindings.get(bindingName);
            if (defaultBinding && currentBinding.text() !== defaultBinding.combos[0].toString()) {
                currentBinding.text(defaultBinding.combos[0].toString());
                this.elements.view.find('.current-binding').trigger('reactivate');
            }
            else if (!defaultBinding) {
                currentBinding.text('');
            }
        },

        onSaveBinding: function(element, e) {
            var self = this;
            // Determine if Combo is valid
            var bindingName    = element.data('save');
            var currentBinding = this.elements.view.find('.current-binding');
            if (currentBinding.text()) {
                var combo = Combo.fromString(currentBinding.text());
                // `add` overrides the previous binding if it exists (which it will)
                this.keybindings.add(bindingName, combo);
                // Hide modal and refresh page
                this.elements.view.find('#editbinding').modal('hide');
            }
            else {
                validationError('You cannot create an empty binding.');
            }

            function validationError(message) {
                var $controlGroup = self.elements.view.find('.current-binding').parents('.control-group');
                var $errorMessage = self.elements.view.find('.current-binding').siblings('.help-inline');
                $controlGroup.addClass('error');
                $errorMessage.hide().text(message).fadeIn('fast');
                delay(function() {
                    $controlGroup.removeClass('error');
                    $errorMessage.fadeOut('fast').text('');
                }, 2000);
            }
        }
    };


    App.init();


})(jQuery, Mustache, Keys);