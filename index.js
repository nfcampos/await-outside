const repl = require('repl')
const vm = require('vm')

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
    return `(async function() {
      let result = (${code.trim()});
      ${binder ? `global.${binder} = result` : 'return result'}
    }())`
  }

  const isRecoverableError = (error) => {
    if (error.name === 'SyntaxError') {
      return /^(Unexpected end of input|Unexpected token)/.test(error.message)
    }
    return false
  }

  replServer.eval = function(originalEval) {
    return function (cmd, context, filename, callback) {
      const match = cmd.match(re)

      if (!match) {
        return originalEval.call(this, cmd, context, filename, callback)
      }

      const code = wrap(match[2], match[1])
      try {
        vm.runInContext(code, vm.createContext(context))
          .then(r => callback(null, r), callback)
      } catch (e) {
        callback(isRecoverableError(e) ? new repl.Recoverable(e) : e)
      }
    }
  }(replServer.eval)
}

module.exports = addAwaitOutside
