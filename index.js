const repl = require("repl");
const vm = require("vm");

// see https://github.com/nodejs/node/blob/master/lib/repl.js#L1371
function isRecoverableError(error) {
  if (error && error.name === "SyntaxError") {
    var message = error.message;
    if (
      message === "Unterminated template literal" ||
      message === "Missing } in template expression"
    ) {
      return true;
    }

    if (
      message.startsWith("Unexpected end of input") ||
      message.startsWith("missing ) after argument list") ||
      message.startsWith("Unexpected token")
    )
      return true;
  }
  return false;
}

function formatError(error) {
  const stackLines = error.stack.split("\n");

  // remove async function invocation from stack
  // ie. first line from `repl` file starting from bottom
  const i = stackLines
    .reverse()
    .findIndex(l => l.trim().startsWith("at repl:"));
  if (i !== -1) stackLines.splice(i, 1);

  error.stack = stackLines.reverse().join("\n");
  return error;
}

/*
- allow whitespace before everything else
- optionally capture `<varname> = `
  - varname only matches if it starts with a-Z or _ or $
    and if contains only those chars or numbers
  - this is overly restrictive but is easier to maintain
- capture `await <anything that follows it>`
*/
let re = /^\s*(?:([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*)?(\(?\s*await[\s\S]*)/;

function isAwaitOutside(source) {
  return re.test(source);
}

function wrapAwaitOutside(source) {
  const [_, identifier, expression] = source.match(re);

  // strange indentation keeps column offset correct in stack traces
  return `(async function() { try { let result = (
${expression.trim()}
);
${identifier ? `global.${identifier} = result` : "return result"}
} catch(error) {
global.ERROR = error
throw error
}
  }())`;
}

function addAwaitOutsideToReplServer(replServer) {
  replServer.eval = (function(originalEval) {
    return function(source, context, filename, cb) {
      if (!isAwaitOutside(source)) {
        return originalEval.call(this, source, context, filename, cb);
      }

      const newSource = wrapAwaitOutside(source);
      const options = { filename, displayErrors: true, lineOffset: -1 };

      try {
        var script = vm.createScript(newSource, options);
      } catch (e) {
        cb(isRecoverableError(e) ? new repl.Recoverable(e) : e);
        return;
      }

      script
        .runInThisContext({ displayErrors: true, breakOnSigint: true })
        .then(r => cb(null, r), err => cb(formatError(err)));
    };
  })(replServer.eval);
}

module.exports = {
  addAwaitOutsideToReplServer,
  wrapAwaitOutside,
  isAwaitOutside
};
