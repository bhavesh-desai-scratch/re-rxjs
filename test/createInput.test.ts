import { createInput } from "../src"
import { scan } from "rxjs/operators"

describe("createInput", () => {
  test("it returns the default value", () => {
    const [getCounter] = createInput(10)
    let value = 0
    const sub = getCounter("foo").subscribe(x => {
      value = x
    })
    expect(value).toBe(10)
    sub.unsubscribe()
  })

  test("it does not emit if no default value was provided and nothing has been emitted", () => {
    const [getCounter] = createInput<number>()
    let nUpdates = 0
    const sub = getCounter("foo").subscribe(() => {
      nUpdates += 1
    })
    expect(nUpdates).toBe(0)
    sub.unsubscribe()
  })

  test("it accepts void inputs", () => {
    const [getClicks$, onClick] = createInput()

    let latestValue: number | undefined = undefined
    const sub = getClicks$("foo")
      .pipe(scan(prev => prev + 1, 0))
      .subscribe(x => {
        latestValue = x
      })

    expect(latestValue).toBe(undefined)

    onClick("foo")
    onClick("foo")
    onClick("foo")
    onClick("foo")

    expect(latestValue).toBe(4)

    sub.unsubscribe()
  })

  test("it replays the latest value to new subscriptions", () => {
    const [getCounter, setCounter] = createInput(10)
    const sub1 = getCounter("foo").subscribe()
    setCounter("foo", 100)

    let value = 0
    const sub2 = getCounter("foo").subscribe(x => {
      value = x
    })

    expect(value).toBe(100)
    sub1.unsubscribe()
    sub2.unsubscribe()
  })

  test("it restarts after everyone unsubscribes", () => {
    const [getCounter, setCounter] = createInput(10)
    const sub1 = getCounter("foo").subscribe()
    const sub2 = getCounter("foo").subscribe()
    setCounter("foo", 100)

    sub1.unsubscribe()
    sub2.unsubscribe()

    let value = 0
    const sub3 = getCounter("foo").subscribe(x => {
      value = x
    })
    expect(value).toBe(10)
    sub3.unsubscribe()
  })

  test("the setter can also be a function", () => {
    const [getCounter, setCounter] = createInput(10)

    let nUpdates = 0
    let latestValue = 0
    const sub1 = getCounter("foo").subscribe(x => {
      latestValue = x
      nUpdates += 1
    })
    expect(nUpdates).toBe(1)
    expect(latestValue).toBe(10)

    setCounter("foo", x => x * 2)
    expect(nUpdates).toBe(2)
    expect(latestValue).toBe(20)

    setCounter("foo", x => x * 2)
    expect(nUpdates).toBe(3)
    expect(latestValue).toBe(40)

    sub1.unsubscribe()
  })
})
