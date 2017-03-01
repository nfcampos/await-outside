const addAwaitOutside = require('.')

setImmediate(() => addAwaitOutside(global.repl.repl))
