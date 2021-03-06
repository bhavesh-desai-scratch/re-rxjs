import { Subject, Observable, ReplaySubject } from "rxjs"
import { distinctShareReplay } from "./operators/distinct-share-replay"

interface CreateInput {
  (): [(key: string) => Observable<void>, (key: string) => void]
  <T>(defaultValue?: T): [
    (key: string) => Observable<T>,
    (key: string, update: T | ((prev: T) => T)) => void,
  ]
}

const empty = Symbol("empty") as any
const F = () => false
const createInput_ = <T>(defaultValue: T = empty) => {
  const cache = new Map<string, [Subject<T>, { latest: T }, Observable<T>]>()
  const getEntry = (key: string) => {
    let result = cache.get(key)
    if (result) return result
    const subject = new ReplaySubject<T>()
    const current = {} as { latest: T }
    if (defaultValue !== empty) {
      subject.next((current.latest = defaultValue))
    }
    const source = distinctShareReplay(F, () => cache.delete(key))(
      subject,
    ) as Observable<T>
    result = [subject, current, source]
    cache.set(key, result)
    return result
  }

  const onChange = (key: string, value: T | ((prev: T) => T)) => {
    const [subject, current] = getEntry(key)
    const nextVal =
      typeof value === "function" ? (value as any)(current.latest) : value
    subject.next((current.latest = nextVal))
  }
  const getSource = (key: string) => getEntry(key)[2]
  return [getSource, onChange] as const
}

export const createInput = createInput_ as CreateInput
