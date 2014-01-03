# Keys.js

For a quick look at the kind of solution that Keys.js is intended to provide, check out the [demo application](http://bitwalker.github.io/keys.js/examples/mail.html).

This project spawned out of a Chrome extension I was working on where I kept handling more and more key combinations for shortcut actions, until it eventually became an unmaintainable rats nest. Obviously I needed a solution, and Keys.js was born.

## Status

Stable, but it's a new project, so as always, caveat emptor. The documentation is very close to comprehensive, but some work needs to be done. The test suite is comprehensive, and very few gaps are left to fill there that are meaningful. Please help me identify any gaps in functionality, testing, or docs, by submitting issues so that I can prioritize things as needed. The current list of things I am working on is as follows:

- Implement locale selection, locale loading
- Implement Sequences (non-chord key combinations)
- Implement scoped bindings (only execute a binding if focus is within the scope of a given element)
- Comprehensive documentation (good progress already)
- Discover additional use cases that aren't covered as well as they could be
- Implement a faux-Vim example to demonstrate a complex usecase of keybindings in a web application.

Check out the [Keys.js](https://bitwalker.github.io/keys.js) home page for information on browser support, dependencies, examples, and in-depth description of how Keys.js works.

## License

Keys.js
Copyright (C) 2014  Paul Schoenfelder

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA