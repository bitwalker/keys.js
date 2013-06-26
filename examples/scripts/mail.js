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
                view: null
            }
        },

        bindings: new Bindings(),

        elements: {
            navInbox: $('.nav .nav-inbox'),
            navSettings: $('.nav .nav-settings'),
            query: $('input.search-query'),
            sidebar: $('.sidebar'),
            view: $('.view')
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
                ]
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
                '#/inbox/\\d+':          this.showInbox,
                '#/inbox/\\w+':          this.showInbox,
                '#/inbox/\\w+/\\d+':     this.showInbox,
                '#/search/read/.+/\\d+': this.searchInbox,
                '#/search/.+':           partial(this.searchInbox, this, 'search'),
                '#/settings':            this.showSettings
            };

            // Compile templates
            this.templates.sidebar           = Mustache.compile($('#sidebar').html());
            this.templates.alert             = Mustache.compile($('#alert').html());
            this.templates.inbox.view        = Mustache.compile($('#inbox').html());
            this.templates.inbox.email       = Mustache.compile($('#email').html());
            this.templates.inbox.readingPane = Mustache.compile($('#reading-pane').html());
            this.templates.settings.view     = Mustache.compile($('#settings').html());

            // Handle hashchange for routing
            $(window).on('hashchange', function() { self.router(location.hash); });

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

            this.refresh();
        },

        router: function(hash) {
            var self  = this;
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

        showInbox: function(inboxType, emailId) {
            // If no inbox type was selected, but a message id was passed in, rearrange the params
            if (/[\d]+/.test(inboxType)) {
                emailId = inboxType;
                inboxType = '';
            }

            // Render Inbox
            var emails = this.getMail(inboxType);
            this.elements.view.html(this.templates.inbox.view(emails));

            // Show welcome popup
            if (this.state.showWelcomePopup) {
                this.showWelcome();
            }

            // Display an email if an email id was provided
            if (emailId) {
                this.readMail(emailId);
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

        searchInbox: function(action, query, emailId) {
            // Render Inbox
            var emails = this.getMail(function(email) {
                return email.subject.indexOf(query) > -1 || email.body.indexOf(query) > -1 || email.from.indexOf(query) > -1;
            });
            this.elements.view.html(this.templates.inbox.view(emails));

            if (action === 'read' && emailId) {
                this.readMail(emailId);
            }

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
            var query = this.elements.query.val();
            location.hash = '#/search/' + encodeURIComponent(query);
            return false;
        },

        onMailSelected: function(element, e) {
            var id = element.data('id');
            // If there is no page specified
            if (!location.hash.split('/').slice(1).length) {
                location.hash = '#/inbox/' + id;
            }
            else {
                // If we're already reading an email
                if (/[\d]+$/.test(location.hash)) {
                    location.hash = location.hash.replace(/[\d]+$/, id);
                }
                else {
                    // If we're searching, then change the action to read
                    if (/#\/search/.test(location.hash)) {
                        location.hash = location.hash.replace(/#\/search\//, '#/search/read/') + '/' + id;
                    }
                    else {
                        location.hash = location.hash + '/' + id;
                    }
                }
            }
        },

        onDeleteMail: function(element, e) {
            e.preventDefault();

            var id = element.data('id');

            this.state.inbox.emails.forEach(function(email) {
                if (email.id == id) {
                    email.trash();
                }
            });

            this.refresh();

            return false;
        },

        onArchiveMail: function(element, e) {
            e.preventDefault();

            var id = element.data('id');

            this.state.inbox.emails.forEach(function(email) {
                if (email.id == id) {
                    email.archive();
                }
            });

            this.refresh();

            return false;
        },

        onMarkAsSpam: function(element, e) {
            e.preventDefault();

            var id = element.data('id');

            this.state.inbox.emails.forEach(function(email) {
                if (email.id == id) {
                    email.markSpam();
                }
            });

            this.refresh();

            return false;
        },

        showSettings: function(settingsType) {
            // Render content
            this.elements.view.html('');

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
                this.elements.view.append(this.templates.inbox.readingPane(email[0]));
            }
        },

        getMail: function(filter, predicate) {
            if (typeof filter === 'function') {
                predicate = filter;
                filter = '';
            }
            var emails = this.state.inbox.emails.filter(function(e) {
                switch (filter) {
                    case 'archived':
                        return predicate ? e.archived && predicate(e) : e.archived === true;
                    case 'trash':
                        return predicate ? e.deleted && predicate(e) : e.deleted === true;
                    default:
                        var criteria = !e.archived && !e.deleted;
                        return predicate ? criteria && predicate(e) : criteria;
                }
            });

            return {
                emails: emails.map(function(e) {
                    // Add view specific properties in order to hide/show actions based on current status
                    if (e.deleted)
                        e.deletable = false;
                    else
                        e.deletable = true;

                    if (e.archived)
                        e.archivable = false;
                    else {
                        // Can't archive a deleted message
                        if (e.deleted)
                            e.archivable = false;
                        else
                            e.archivable = true;
                    }

                    if (e.hasLabel(Label.spam)) {
                        e.isSpam = true;
                        e.markable = false;
                    }
                    else {
                        e.isSpam = false;
                        e.markable = true;
                    }
                    return e;
                })
            };
        },

        renderSidebar: function(data) {
            this.elements.sidebar.html(this.templates.sidebar(data));
        },

        /** Settings Actions **/

        saveSettings: function() {

        },

        loadSettings: function() {

        }
    };


    App.init();



})(jQuery, Mustache, Keys);