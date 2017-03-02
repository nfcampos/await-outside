const {isAwaitOutside, wrapAwaitOutside} = require('../')

describe('isAwaitOutside', () => {
  it('returns true for await expressions', () => {
    // literal
    expect(isAwaitOutside('await 3')).toBe(true)
    // function call
    expect(isAwaitOutside('await fetch()')).toBe(true)
    // method call
    expect(isAwaitOutside('await Promise.resolve(3)')).toBe(true)
    // new line
    expect(isAwaitOutside(`await fetch({
    })`)).toBe(true)
    // assignment
    expect(isAwaitOutside('abc = await 3')).toBe(true)
    // (await p).property
    expect(isAwaitOutside('(await Promise.resolve([]))[0]')).toBe(true)
    // assignment of (await p).property
    expect(isAwaitOutside('abc = (await Promise.resolve([]))[0]')).toBe(true)
  })

  it('returns false for anyting else', () => {
    // literal
    expect(isAwaitOutside('3')).toBe(false)
    // function call
    expect(isAwaitOutside('fetch()')).toBe(false)
    // await as property name
    expect(isAwaitOutside('P.await(3)')).toBe(false)
    // await inside async function
    expect(isAwaitOutside(`async function abc() { await 3 }`)).toBe(false)
    // await inside async function with new line
    expect(isAwaitOutside(`async function abc() {
      await 3
    }`)).toBe(false)
    // await inside async =>
    expect(isAwaitOutside(`abc = async () => { await 3 }`)).toBe(false)
    // await inside =>
    expect(isAwaitOutside(`abc = () => { await 3 }`)).toBe(false)
  })
})
