/**
 * # User password generation
 *
 * @packageDocumentation
 */

import { DocumentSnapshot, DocumentData } from '@google-cloud/firestore'
import * as admin from 'firebase-admin'

import { isNat, parseIntStrict } from 'lib/utils/integer'
import { unique, randRange, choose } from 'lib/utils/random'

/**
 * Array-like of words used for password generation
 *
 * @category Words
 */
interface Words {
    /** Array with all the words */
    readonly data: string[]
    /** Number of words */
    readonly length: number
    /**
     * Positional access
     *
     * Should be `string` for integer in `[0, length)`
     */
    readonly [field: number]: string | undefined
}

/**
 * Functions related to [[Words|`Words`]]
 *
 * @category Words
 */
namespace Words {
    /** Firestore Document */
    type Document = DocumentSnapshot<DocumentData>

    /**
     * Helper class for accessing firestore database
     *
     * @category Words
     */
    class WordsInner {
        constructor(readonly doc: Document) { }

        /** @ignore Asserts that value is valid */
        private assert<T>(value: T | undefined): asserts value is T {
            if (value === undefined) {
                throw new Error(`document ${this.doc.id} is not a 'Words'-like document`)
            }
        }

        /** @ignore Asserts a valid position */
        private validPosition(pos: number, prop: 'length' | 'position'): void {
            // 'length' should be positive integer
            // 'position' also accepts zero
            if (! isNat(`${pos}`) || prop === 'length' && `${pos}` === '0') {
                const msg = `invalid 'Words' ${prop}: expected natural number, got ${pos}`
                throw new Error(msg)
            }
        }

        /** Number of words in database */
        length(): number {
            const lengthText = this.doc.get('length')
            this.assert(lengthText)

            const length = parseInt(lengthText, 10)
            this.validPosition(length, 'length')
            return length
        }

        /** All words in database */
        data(): string[] {
            const data = this.doc.data()
            this.assert(data)
            delete data.length

            return Object.values(data)
        }

        /** Recover word at given position */
        get(position: number): string | undefined {
            this.validPosition(position, 'position')
            return this.doc.get(`${position}`)
        }

        /** @ignore */
        toString(): string {
            return `[Words length = ${this.length()}]`
        }
    }

    /**
     * Generates a [[Words|`Words`]] object from
     * a firestore document
     *
     * @category Words
     */
    export function fromDoc(doc: Document): Words {
        const inner = new WordsInner(doc)
        inner.length()

        // uses proxy for generic getters
        const proxy = new Proxy(inner, {
            get: function (target, property) {
                if (typeof property === 'symbol') {
                    return undefined
                } else if (property === 'length') {
                    return target.length()
                } else if (property === 'data') {
                    return target.data()
                } else {
                    const pos = parseIntStrict(property)
                    if (pos === undefined || !isNat(`${pos}`)) {
                        return undefined

                    } else {
                        return target.get(pos)
                    }
                }
            }
        })
        // TODO: test this throughtly
        return proxy as unknown as Words
    }

    /**
     * Loads a [[Words|`Words`]] from Firestore
     * at `words/words`
     *
     * @category Words
     */
    export async function load(): Promise<Words> {
        const doc = await admin.firestore()
            .collection('words')
            .doc('words')
            .get()

        if (!doc.exists) {
            throw new Error(`document 'words' does not exist yet`)
        }

        return fromDoc(doc)
    }
}

/** @ignore Capitalize first letter */
function capitalize(s: string): string {
    return s[0].toUpperCase() + s.substring(1).toLowerCase()
}

/** @ignore Words separators */
const seps = ['-', '_', '.', ',', '*', '@']
/** @ignore Words transformations */
const forms: ((s: string) => string)[] = [capitalize, s => s.toLowerCase(), s => s.toUpperCase()]

/**
 * Generates a random password with different words from database
 *
 * The words are transformed randomly as uppercase, lowercase or capitalized.
 * They are also connected with a chosen separator between
 * `['-', '_', '.', ',', '*', '@']`
 *
 * @param amount Amount of words to use
 */
export async function generatePassword(amount = 3): Promise<string> {
    const promises = <const> [choose(seps), choose(forms), Words.load()]
    const [sep, form, wordList] = await Promise.all(promises)
    // unique values in [0, length)
    const rand = unique(randRange, wordList.length)

    // random indices
    const indices = new Array(amount).fill(undefined).map(() => rand())
    // safe casting, assuming indices are in [0, length)
    const words = (await Promise.all(indices)).map(i => wordList[i] as string)

    return words.map(form).join(sep)
}
