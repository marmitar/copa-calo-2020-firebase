/**
 * # Utilities for avoiding data races
 *
 * Only a [[Lock|`Lock<T>`]] for now
 *
 * @packageDocumentation
 */


/**
 * # Lock\<T>
 *
 * A simple mutex-like lock implemented as queue
 *
 * ## Example
 *
 * ```typescript
 *  class ThreadSafeCounter<T> {
 *      private counter: Lock<Map<T, number>>
 *
 *      constructor() {
 *          this.counter = new Lock(new Map())
 *      }
 *
 *      async count(value: T): Promise<number> {
 *          lconst ock = await this.counter.lock()
 *          const cnt = lock.value.get(name) ?? 0
 *
 *          lock.unlock()
 *          return cnt
 *      }
 *
 *      async increment(value: T): Promise<number> {
 *          const lock = await this.counter.lock()
 *
 *          const cur = lock.value.get(name) ?? 0
 *          const cnt = cur + 1
 *          lock.value.set(name, cnt)
 *
 *          lock.unlock()
 *          return cnt
 *      }
 *  }
 * ```
 *
 * Taken from {@link https://stackoverflow.com/a/37792247/7182981 | Stack Overflow}
 *
 * @typeparam T  The type of the protected value
 */
export class Lock<T> {
    /** Current lock state */
    private locked: boolean
    /** Queue waiting for lock */
    private waiting: (() => void)[]

    /**
     * @param value  The value protected by this lock
     */
    constructor(private value: T) {
        this.locked = false
        this.waiting = []
    }

    /**
     * Asynchronously wait for a lock and resolves
     * with the protected value
     */
    async lock(): Promise<Locked<T>> {
        if (this.locked) {
            // insert the promise resolution on waiting queue
            return new Promise(resolver => {
                this.waiting.push(() => this.resolve(resolver))
            })

        } else {
            this.locked = true
            // a new promise is necessary in case `T` is a promise
            return new Promise(resolver => this.resolve(resolver))
        }
    }

    /**
     * Resolves the promise resolver with the locked value
     *
     * See also [[Locked|`Locked<T>`]]
     */
    private resolve(resolver: (lock: Locked<T>) => void): void {
        resolver(new Locked(this.value, () => this.unlock()))
    }

    /**
     * Unlocks the value for the next one
     * waiting on the value
     */
    private unlock(): void {
        const resolve = this.waiting.shift()

        if (resolve === undefined) {
            // full unlock on empty queue
            this.locked = false

        } else {
            // transfer lock for next in queue
            resolve()
        }
    }
}

/**
 * # Locked\<T>
 *
 * The locked form of a [[Lock|`Lock<T>`]]
 *
 * @typeparam T  The type of the protected value
 */
class Locked<T> {
    /** inner value, may be absent */
    private inner: {
        unlocked: true
    } | {
        unlocked: false,
        value: T
    }

    /**
     * @param value  Protected value
     * @param unlocker  Callback for unlocking the value
     */
    constructor(value: T, private unlocker: () => void) {
        this.inner = {
            unlocked: false,
            value
        }
    }

    /**
     * The inner protected value
     *
     * Errors if value already unlocked
     */
    get value(): T {
        if (this.inner.unlocked) {
            throw new Error('Lock alread unlocked, no value present')
        }
        return this.inner.value
    }

    /**
     * Unlocks the protected the value for the next waiting on lock
     *
     * Errors if value already unlocked
     */
    unlock(): void {
        this.value
        this.unlocker()
        this.inner = { unlocked: true }
    }
}
