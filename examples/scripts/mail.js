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

    var App = {

        routes: {
            '/inbox':       partial(App.navigate, App, 'inbox'),
            '/inbox/all':   partial(App.navigate, App, 'inbox'),
            '/inbox/spam':  partial(App.navigate, App, 'inbox', 'spam'),
            '/inbox/trash': partial(App.navigate, App, 'inbox', 'trash'),
            '/settings':    partial(App.navigate, App, 'settings')
        },

        templates: {
            'inbox':     null,
            'settings':  null,
            'emailItem': null
        },

        bindings: new Bindings(),

        elements: {
            navInbox: $('.nav .nav-inbox'),
            navSettings: $('.nav .nav-settings'),
            query: $('input.search-query'),
        },

        init: function() {
            var self = this;

            // Handle hashchange for routing
            $(window).on('hashchange', function() {
                // Creates an array starting with the page, ex. ["inbox"] or ["inbox", "trash"]
                var args = location.hash.replace('#/', '').split('/');
                self.navigate.apply(self, args);
            });

            // Handle inbox search
            $('form.navbar-search').on('submit', function(e) {
                e.preventDefault();
                self.searchInbox(self.elements.query.val());
                return false;
            });
        },

        navigate: function(page, filter) {
            if (!page) page = 'inbox';
            if (!filter) filter = 'all';
            switch (page) {
                case 'inbox':
                    this.showInbox(filter);
                    break;
                case 'settings':
                    this.showSettings();
                    break;
            }
        },

        showInbox: function(inboxType) {

        },

        /** Inbox Actions **/

        searchInbox: function(query) {

        },

        /** Settings Actions **/
        showSettings: function() {

        },

        saveSettings: function() {

        },

        loadSettings: function() {

        }
    };

    App.init();

})(jQuery, Mustache, Keys);