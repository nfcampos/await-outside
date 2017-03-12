const { isAwaitOutside, wrapAwaitOutside } = require("../");

describe("isAwaitOutside", () => {
  it("returns true for await expressions", () => {
    // literal
    expect(isAwaitOutside("await 3")).toBe(true);
    // function call
    expect(isAwaitOutside("await fetch()")).toBe(true);
    // method call
    expect(isAwaitOutside("await Promise.resolve(3)")).toBe(true);
    // new line
    expect(
      isAwaitOutside(
        `await fetch({
    })`
      )
    ).toBe(true);
    // assignment
    expect(isAwaitOutside("abc = await 3")).toBe(true);
    // var assignment
    expect(isAwaitOutside("var abc = await 3")).toBe(true);
    // let assignment
    expect(isAwaitOutside("let abc = await 3")).toBe(true);
    // const assignment
    expect(isAwaitOutside("const abc = await 3")).toBe(true);
    // (await p).property
    expect(isAwaitOutside("(await Promise.resolve([]))[0]")).toBe(true);
    // assignment of (await p).property
    expect(isAwaitOutside("abc = (await Promise.resolve([]))[0]")).toBe(true);
    // assignment of (await p).property with whitespace
    expect(isAwaitOutside("    abc = (await Promise.resolve([]))[0]")).toBe(
      true
    );
  });

  it("returns false for anyting else", () => {
    // literal
    expect(isAwaitOutside("3")).toBe(false);
    // function call
    expect(isAwaitOutside("fetch()")).toBe(false);
    // await as property name
    expect(isAwaitOutside("P.await(3)")).toBe(false);
    // await inside async function
    expect(isAwaitOutside(`async function abc() { await 3 }`)).toBe(false);
    // await inside async function with new line
    expect(
      isAwaitOutside(
        `async function abc() {
      await 3
    }`
      )
    ).toBe(false);
    // await inside async =>
    expect(isAwaitOutside(`abc = async () => { await 3 }`)).toBe(false);
    // await inside =>
    expect(isAwaitOutside(`abc = () => { await 3 }`)).toBe(false);
  });
});

describe("wrapAwaitOutside", () => {
  it("wraps await expressions", () => {
    // literal
    expect(wrapAwaitOutside("await 3")).toEqual([
      `(async function() { try { return (
await 3
); } catch(e) { global.ERROR = e; throw e; } }())`,

      null
    ]);
    // function call
    expect(wrapAwaitOutside("await fetch()")).toEqual([
      `(async function() { try { return (
await fetch()
); } catch(e) { global.ERROR = e; throw e; } }())`,

      null
    ]);
    // method call
    expect(wrapAwaitOutside("await Promise.resolve(3)")).toEqual([
      `(async function() { try { return (
await Promise.resolve(3)
); } catch(e) { global.ERROR = e; throw e; } }())`,

      null
    ]);
    // new line
    expect(
      wrapAwaitOutside(
        `await fetch({
    })`
      )
    ).toEqual([
      `(async function() { try { return (
await fetch({
    })
); } catch(e) { global.ERROR = e; throw e; } }())`,

      null
    ]);
    // assignment
    expect(wrapAwaitOutside("abc = await 3")).toEqual([
      `(async function() { try { global.__await_outside_result = (
await 3
); } catch(e) { global.ERROR = e; throw e; } }())`,

      `abc = global.__await_outside_result; void delete global.__await_outside_result;`
    ]);
    // var assignment
    expect(wrapAwaitOutside("var abc = await 3")).toEqual([
      `(async function() { try { global.__await_outside_result = (
await 3
); } catch(e) { global.ERROR = e; throw e; } }())`,

      `var abc = global.__await_outside_result; void delete global.__await_outside_result;`
    ]);
    // let assignment
    expect(wrapAwaitOutside("let abc = await 3")).toEqual([
      `(async function() { try { global.__await_outside_result = (
await 3
); } catch(e) { global.ERROR = e; throw e; } }())`,

      `let abc = global.__await_outside_result; void delete global.__await_outside_result;`
    ]);
    // const assignment
    expect(wrapAwaitOutside("const abc = await 3")).toEqual([
      `(async function() { try { global.__await_outside_result = (
await 3
); } catch(e) { global.ERROR = e; throw e; } }())`,

      `const abc = global.__await_outside_result; void delete global.__await_outside_result;`
    ]);
    // (await p).property
    expect(wrapAwaitOutside("(await Promise.resolve([]))[0]")).toEqual([
      `(async function() { try { return (
(await Promise.resolve([]))[0]
); } catch(e) { global.ERROR = e; throw e; } }())`,

      null
    ]);
    // assignment of (await p).property
    expect(wrapAwaitOutside("abc = (await Promise.resolve([]))[0]")).toEqual([
      `(async function() { try { global.__await_outside_result = (
(await Promise.resolve([]))[0]
); } catch(e) { global.ERROR = e; throw e; } }())`,

      `abc = global.__await_outside_result; void delete global.__await_outside_result;`
    ]);
    // assignment of (await p).property with whitespace
    expect(
      wrapAwaitOutside("    abc = (await Promise.resolve([]))[0]")
    ).toEqual([
      `(async function() { try { global.__await_outside_result = (
(await Promise.resolve([]))[0]
); } catch(e) { global.ERROR = e; throw e; } }())`,

      `abc = global.__await_outside_result; void delete global.__await_outside_result;`
    ]);
  });
});
