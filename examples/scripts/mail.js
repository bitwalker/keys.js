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
        this.id = generateId(8);
        this.from = from;
        this.labels = labels;
        this.subject = subject;
        this.body = loremIpsum();
        this.received = received;
        this.archived = false;
        this.deleted = false;

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

    function Label(name, type) {
        this.name = name;
        this.type = type;
    }
    // Static labels
    Label.important = new Label('Important', 'important');
    Label.friend    = new Label('Friend', 'info');
    Label.family    = new Label('Family', 'success');
    Label.work      = new Label('Work', 'default');
    Label.spam      = new Label('Spam', 'warning');

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
                'default':            this.showInbox,
                '#/inbox':            this.showInbox,
                '#/inbox/\\w+':       this.showInbox,
                '#/inbox/\\w+/\\d+':  this.showInbox,
                '#/settings':         this.showSettings
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
            $('form.navbar-search').on('submit', function(e) {
                e.preventDefault();
                self.searchInbox(self.elements.query.val());
                return false;
            });

            this.elements.view.on('click', '.email', function() {
                var email = $(this);
                var id = email.data('id');
                location.hash = location.hash + '/' + id;
            });

            // Kickstart the router
            $(window).trigger('hashchange');
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

        showInbox: function(inboxType, messageId) {
            // Render Inbox
            var inbox = {
                emails: this.state.inbox.emails.filter(function(email) {
                    switch (inboxType) {
                        case 'archived':
                            return email.archived === true;
                        case 'trash':
                            return email.deleted === true;
                        default:
                            return !(email.archived || email.deleted);
                    }
                })
            };
            this.elements.view.html(this.templates.inbox.view(inbox));

            if (this.state.showWelcomePopup) {
                this.state.showWelcomePopup = false;
                var welcome = 'Demo Mail is an entirely keyboard driven mail application. Menus can be navigated by mouse or keyboard. To get started, CTRL+SHIFT+K!';
                this.elements.view.prepend(this.templates.alert(new Alert(welcome)));
            }

            // Render Reading Pane (if needed)
            if (messageId) {
                var email = this.state.emails.filter(function(e) {
                    if (e.id === messageId) return true;
                    else return false;
                });
                console.log(email);
                if (email.length) {
                    this.elements.view.append(this.templates.inbox.readingPane(email[0]));
                }
            }

            // Render sidebar
            var sidebar = {
                items: [
                    new SidebarItem('inbox', 'Inbox', !inboxType),
                    new SidebarItem('inbox', 'Archived', inboxType === 'archived'),
                    new SidebarItem('inbox', 'Trash',    inboxType === 'trash')
                ]
            };
            this.elements.sidebar.html(this.templates.sidebar(sidebar));

            // Change active nav item
            this.elements.navInbox.addClass('active');
            this.elements.navSettings.removeClass('active');
        },

        showSettings: function(settingsType) {
            // Render content
            this.elements.view.html('');

            // Render sidebar
            var sidebar = {
                items: [
                    new SidebarItem('settings', 'Keybindings', true)
                ]
            };
            this.elements.sidebar.html(this.templates.sidebar(sidebar));

            // Change active nav item
            this.elements.navSettings.addClass('active');
            this.elements.navInbox.removeClass('active');
        },

        /** Inbox Actions **/

        searchInbox: function(query) {

        },

        /** Settings Actions **/

        saveSettings: function() {

        },

        loadSettings: function() {

        }
    };


    App.init();



})(jQuery, Mustache, Keys);