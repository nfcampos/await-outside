const { addAwaitOutsideToReplServer } = require(".");

// if used as `node --require await-outside/repl` repl server will only be
// created after this file is evaluated, thus the setImmediate to wait for it
setImmediate(() => addAwaitOutsideToReplServer(global.repl.repl));
