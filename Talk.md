# [fit] `await-`
# [fit] `-outside`

A better Node REPL for asynchronous exploration

---

## From This

```
$ node
> const request = require('superagent')
undefined
> request.get('https://www.googleapis.com/books/v1/volumes').      
... query({q: 'paul auster'}).
... then(r => r.body)
Promise { <pending> }
>
```

---

## To This

```
$ await-outside
> const request = require('superagent')
undefined
> await request.get('https://www.googleapis.com/books/v1/volumes').
... query({q: 'paul auster'}).
... then(r => r.body)
{ kind: 'books#volumes',
  totalItems: 2342,
  items: [ ... ] }
>
```

---

## How (I)

- Replace the `eval(source, context, filename, callback)` method of the REPL server
- An ugly regular expression to extract `await` expressions from `source`.

```
/^\s*(?:([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*)?(\(?\s*await[\s\S]*)/
```

---

## How (II)

- Wrap it in an (immediately invoked) async function
- Catch syntax errors to allow recovery
- Run the wrapped code and pass the promise result to `callback`

---

## Where to find it

- `npm i -g await-outside`
- `https://github.com/nfcampos/await-outside`

### And it has tests!
