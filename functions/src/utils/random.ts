/**
 * # Utilities for random sources
 *
 * @packageDocumentation
 */

import { randomBytes } from 'crypto'
import { promisify } from 'util'

import { Lock } from './lock'


/** @ignore Async `randomBytes` */
const bytes = promisify(randomBytes)

/** @ignore Length of random bytes */
const LEN = 6
/** @ignore One more than maximum value represented with [[LEN]] bytes */
const MAX = 1 << (4 * LEN)

/**
 * Asynchronously generates a random number in
 * the open range [0.0, 1.0)
 *
 * @category Random
 */
export async function random(): Promise<number> {
    const b = await bytes(LEN)
    const num = b.readUIntBE(0, LEN)
    return num / MAX
}

/**
 * Asynchronously generates a random integer
 * from `min` up to, but not including, `max`
 *
 * `min` is assumed `0`, if not provided
 *
 * @category Random
 */
// tslint:disable-next-line:unified-signatures
export async function randRange(max: number): Promise<number>
// tslint:disable-next-line:unified-signatures
export async function randRange(min: number, max: number): Promise<number>
export async function randRange(min: number, max?: number): Promise<number> {
    // TODO: test this
    const [start, diff] = (max === undefined)? [0, min] : [min, max]

    const value = await random()
    return Math.floor(start + value * diff)
}

/**
 * Randomly selects a value from an array
 *
 * @param values Non-empty array
 *
 * @category Random
 */
export async function choose<T>(values: T[]): Promise<T> {
    const i = await randRange(values.length)
    return values[i]
}

/**
 * Extracts the result type of a possible Promise
 *
 * ## Example
 *
 * ```typescript
 *  type A = Result<Promise<string>> // string
 *
 *  type B = Result<number> // number
 * ```
 *
 * @category Types
 */
type Result<P> = P extends Promise<infer R>? R : P
/**
 * Extracts the return type of a possibly async function
 *
 * ## Example
 *
 * ```typescript
 *  async function f(): Promise<string> {
 *      return new Promise(res => setTimeout(() => res('hello'), 500))
 *  }
 *
 *  function g(): number {
 *      return 12
 *  }
 *
 *
 *  type A = SyncReturn<typeof f> // string
 *
 *  type B = SyncReturn<typeof g> // number
 * ```
 *
 * @category Types
 */
type SyncReturn<F extends (...args: any[]) => any> = Result<ReturnType<F>>

/**
 * Garantees that consecutive calls to the new function are unique
 *
 * ## Caution
 *
 * Should be used with care as it may run indefinetely if the original
 * function cannot generate different values for every call
 *
 * ## Example
 *
 * ```typescript
 *  async function chooseTwo<T>(values: T[]): Promise<[T, T]> {
 *      const chooseWord = unique(choose, values)
 *      return Promise.all([chooseWord(), chooseWord()])
 *  }
 *
 *  const x = chooseTwo(['hello', 'there', 'world']) // OK
 *
 *  const y = chooseTwo(['only one']) // never resolves
 * ```
 */
export function unique<Args extends any[], F extends (...args: Args) => any>(func: F, ...args: Args): () => Promise<SyncReturn<F>> {
    // values already produced
    const values = new Lock(new Set())

    async function wrapped(): Promise<SyncReturn<F>> {
        // loop until it generates a different value
        while (true) {
            const value = await func(...args)
            const lock = await values.lock()

            // only return with a different value
            if (! lock.value.has(value)) {
                lock.value.add(value)
                lock.unlock()
                return value
            }
            // otherwise, keeps running
            lock.unlock()
        }
    }
    return wrapped
}
