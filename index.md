---
layout: default
title: Introduction
---

## Demo

For a quick view of the kind of functionality that Keys.js is intended to provide, check out the [demo application](examples/mail.html). It is a simulated web mail application with configurable keyboard shortcuts.

## Features

- Define bindings with a name, and assign one or more keys or combinations of keys
- Attach behavior to a binding
- Execute one or more behaviors for a single binding
- Execute toggle-like behavior for a binding using a simple API for that use case
- Enable/disable bindings by name, or all at once
- Use a simple API based on objects instead of strings to catch errors early on (spelling mistakes are caught immediately). This also allows Keys.js to help prevent creating invalid key combinations.
- Serialize bindings for persistance using localStorage, or uploading to a server for personalized keybindings in your web application. Deserialize them easily using the same API.

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

Key.js polyfills `Array.forEach`, `Array.map`, `Array.filter` and `Array.indexOf` **if they are not already implemented by the browser, or another library**, for internal use. I currently have no plans to remove these polyfills, but if it is causing issues for you, let me know and I'll look into alternative approaches. If you are curious, the decision to polyfill those methods was due to my opinion that the improvements in code clarity and maintainability make them worthwhile.

## Coming Soon!

- Scoped bindings (only execute a binding if focus is within the scope of a given element)
- Sequences (non-chord key combinations - think the Konami code)


## License

This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License.