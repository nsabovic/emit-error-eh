# Emit error, eh?

A tool to find Streams that don't have handlers for their `error` event.

# Why?

`error` events are special. If not handled, they throw. When they do, you get an
exception, and since most often events are used to throw asynchronously, this
means you get an uncaught exception.

## Why not all EventEmitters?

Not all EventEmitters can emit errors in the first place. Streams cover sockets,
requests, responses and files. That's enough for now.

# How does it work?

You write:

    var e = require('emit-error-eh');

and optionally:

    e.logger = function(err) { /* console.log() is default */};

    // Add some stack traces which you want ignored.
    e.ignored = [
      [
        { name: 'new Socket', module: 'net.js'},
        { name: 'Agent.createConnection', module: 'net.js'},
        { name: 'Agent.createSocket', module: 'http.js'},
        { name: 'Agent.addRequest', module: 'http.js'},
        { name: 'new ClientRequest', module: 'http.js'},
      ],
      [
        { name: 'WriteStream.Socket', module: 'net.js'},
        { name: 'new WriteStream', module: 'tty.js'},
        { name: 'createWritableStdioStream', module: 'node.js'},
      ]
    ];

Voila. Your logger function will be called every time someone creates a Stream
without assigning it an `error` handler.
