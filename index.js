var util = require('util');
var stream = require('stream');

// Monkey-patch Stream constructor
function PatchedStream() {
  // Run the real constructor
  stream.Stream.apply(this, arguments);

  // If called as constructor...
  if (this instanceof stream.Stream) {
    // Capture the stack of the constructor call.
    var err = new Error("Stream created withouth an error handler");
    var that = this;

    // When the control goes back to the event loop...
    process.nextTick(function() {
      // Check that there is a handler for `error` event.
      if (!that._events || !that._events.error ||
          (Array.isArray(that._events.error) && !that._events.error.length)) {
        // Get the stack.
        var stack = err.stack.split('\n');
        // First two lines are the patch.
        stack.splice(1, 2);
        // Check for the list of ignored stacks.
        if (!isIgnored(stack.slice(1))) {
          // Not ignored, report it.
          err.stack = stack.join('\n');
          module.exports.logger(err);
        }
      }
    });
  }
}

// One thing that all the derived classes do is call the constructor via `call`.
// We can't point Stream to our PatchedStream since it's already cached, but we
// can patch its `call` function.
stream.Stream.call = function() {
  var args = Array.prototype.slice.call(arguments);
  var thiz = args.shift();
  PatchedStream.apply(thiz, args);
}

// Get the stack function name and module out of the trace.
var stackMatcher = /^\s*at (.*) \((.*):\d+:\d+\)/;

// Check if the stack is one of the ignored stack prefixes.
function isIgnored(stack) {
  // This checks whether the stack matches just one prefix.
  function prefixIgnored(prefix, stack) {
    for (var i = 0; i < prefix.length; ++i) {
      var match = stack[i].match(stackMatcher);
      if (!match
         || match[1] !== prefix[i].name || match[2] !== prefix[i].module) {
        return false;
      }
    }
    return true;
  }

  for (var i in module.exports.ignored) {
    if (prefixIgnored(module.exports.ignored[i], stack)) {
      return true;
    }
  }
  return false;
}

// Example ignored stack traces for node 0.6.15. You'll want to use your own.
module.exports.ignored = [
  [
    { name: 'new Socket', module: 'net.js'},
    { name: 'Agent.createConnection', module: 'net.js'},
    { name: 'Agent.createSocket', module: 'http.js'},
    { name: 'Agent.addRequest', module: 'http.js'},
    { name: 'new ClientRequest', module: 'http.js'},
  ],
  [
    { name: 'new IncomingMessage', module: 'http.js'},
    { name: 'HTTPParser.onHeadersComplete', module: 'http.js'},
    { name: 'Socket.ondata', module: 'http.js'},
    { name: 'TCP.onread', module: 'net.js'},
  ],
  [
    { name: 'WriteStream.Socket', module: 'net.js'},
    { name: 'new WriteStream', module: 'tty.js'},
    { name: 'createWritableStdioStream', module: 'node.js'},
  ]
];
// Which function to call when a Stream without `error` is found.
module.exports.logger = function(err) { console.log(err.stack); }
