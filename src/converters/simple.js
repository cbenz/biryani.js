import {converted} from "../converted"
import {pipe} from "./compound"
import * as functions from "../functions"
import * as logging from "../logging"


// Converters
// (value) => converted
// (...args) => (value) => converted

// Low-level JavaScript converters

export const parseInt = (value) => {
  if (value === null) {
    return converted(null, null)
  }
  const result = global.parseInt(value)
  return isNaN(result) ? converted(value, "Integer representation expected") : converted(result, null)
}

export const add = (n) => (value) => converted(value === null ? null : value + n, null)

// export const test = (predicate, error = "Test failed") => (value) =>
//   value === null ? converted(null, null) : converted(value, predicate(value) ? null : error)
export const test = (predicate, error = "Test failed") => (value) => converted(value, predicate(value) ? null : error)

export const testLowerThan = (threshold, {orEqual = false} = {}) => test(
  (value) => orEqual ? value <= threshold : value < threshold,
  `value ${orEqual ? "<=" : "<"} ${threshold} expected`,
)

export const testGreaterThan = (threshold, {orEqual = false} = {}) => test(
  (value) => orEqual ? value >= threshold : value > threshold,
  `value ${orEqual ? ">=" : ">"} ${threshold} expected`,
)

export const testBetween = (low, high, {excludeBounds = false} = {}) => test(
  (value) => excludeBounds ? low < value && value < high : low <= value && value <= high,
  `${low} ${excludeBounds ? "<" : "<="} value ${excludeBounds ? "<" : "<="} ${high} expected`,
)

export const testArray = test(functions.isArray, "Array expected")
export const testInteger = test(functions.isInteger, "Integer expected")
export const testObject = test(functions.isObject, "Object expected")
export const testString = test(functions.isString, "String expected")

export const testPropertyEquals = (propName, expectedValue,
  error = `value[${propName}] == ${expectedValue} expected`) => test((value) => value[propName] == expectedValue, error)

export const testLength = (length) => testPropertyEquals("length", length, `value.length == ${length} expected`)

export const testNotNull = (value) => converted(value, value === null ? "Not null expected" : null)

export const testScalar = test(functions.isScalar, "Scalar expected")

export const toInteger = (value) => functions.isInteger(value) ? converted(value) : pipe(testScalar, parseInt)(value)


// Debug converters

export function debug(value) {
  debugger
  return value
}

const logTap = logging.createLog("converters:tap")
export function tap(value) {
  logTap(value)
  return value
}
