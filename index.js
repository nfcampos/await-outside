const repl = require('repl')
const vm = require('vm')

// see https://github.com/nodejs/node/blob/master/lib/repl.js#L1371
function isRecoverableError(e) {
  if (e && e.name === 'SyntaxError') {
    var message = e.message;
    if (message === 'Unterminated template literal' ||
        message === 'Missing } in template expression') {
      return true;
    }

    if (message.startsWith('Unexpected end of input') ||
        message.startsWith('missing ) after argument list') ||
        message.startsWith('Unexpected token'))
      return true;

  }
  return false;
}

function formatError(e) {
  const stackLines = e.stack.split('\n')

  // remove async function invocation from stack
  // ie. first line from `repl` file starting from bottom
  const i = stackLines.reverse().findIndex(l => l.trim().startsWith('at repl:'))
  if (i) stackLines.splice(i, 1)

  e.stack = stackLines.reverse().join('\n')
  return e
}

function addAwaitOutside(replServer) {
  /*
  - allow whitespace before everything else
  - optionally capture `<varname> = `
    - varname only matches if it starts with a-Z or _ or $
      and if contains only those chars or numbers
    - this is overly restrictive but is easier to maintain
  - capture `await <anything that follows it>`
  */
  let re = /^\s*(?:([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*)?(await[\s\S]*)/

  const wrap = (code, binder) => {
    // strange indentation keeps column offset correct in stack traces
    return `(async function() { let result = (
${code.trim()}
);
      ${binder ? `global.${binder} = result` : 'return result'}
    }())`
  }

  replServer.eval = function(originalEval) {
    return function (cmd, context, filename, callback) {
      const match = cmd.match(re)

      if (!match) {
        return originalEval.call(this, cmd, context, filename, callback)
      }

      const code = wrap(match[2], match[1])

      try {
        var script = vm.createScript(code, { filename, displayErrors: true, lineOffset: -1 })
      } catch (e) {
        callback(isRecoverableError(e) ? new repl.Recoverable(e) : e)
        return
      }

      script.runInThisContext({ displayErrors: true, breakOnSigint: true })
        .then(r => callback(null, r), err => callback(formatError(err)))
    }
  }(replServer.eval)
}

module.exports = addAwaitOutside
