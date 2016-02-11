# Keys.js

For a quick look at the kind of solution that Keys.js is intended to provide, check out the [demo application](http://bitwalker.github.io/keys.js/examples/mail.html).

This project spawned out of a Chrome extension I was working on where I kept handling more and more key combinations for shortcut actions, until it eventually became an unmaintainable rats nest. Obviously I needed a solution, and Keys.js was born.

## Installation

```
$ npm install --save keys.js
```

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

MIT

See LICENSE file
