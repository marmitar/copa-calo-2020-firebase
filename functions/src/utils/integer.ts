/**
 * # Utilities functions related to integers
 *
 * @packageDocumentation
 */


/** Regex for a string representing an integer */
const integerRegex = /^-?\d+$/
/** Regex for a string representing an integer */
const naturalRegex = /^([1-9]\d*|0)$/

/**
 * Validates if a string is a valid integer representation
 * in base 10
 *
 * @category String Validation
 */
export function isInt(text: string): boolean {
    return integerRegex.test(text)
}

/**
 * Validates if a string is a valid natural number
 * representation in base 10
 *
 * Natural numbers as positive integers, but also zero (`0`)
 *
 * @category String Validation
 */
export function isNat(text: string): boolean {
    return naturalRegex.test(text)
}

/**
 * Parse a string or number as integer
 *
 * String are parsed with
 * {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt | parseInt},
 * but only if it is a valid integer base 10. Avoids simple
 * problems like `parseInt("") // 0` .
 *
 * Numbers are just passed along when a valid integer for
 * {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger | Number.isInteger}.
 *
 * See also:
 *  - [[isInt|`isInt`]]
 *  - {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt#Description | `parseInt` problems}
 *
 * @returns     The parsed number if successful or undefined otherwise
 *
 * @category Integer Parsing
 */
export function parseIntStrict(num: string | number): number | undefined {
    if (typeof num === 'string' && integerRegex.test(num)) {
        return parseInt(num, 10)

    } else if (typeof num === 'number' && Number.isInteger(num)) {
        return num

    } else {
        return undefined
    }
}
