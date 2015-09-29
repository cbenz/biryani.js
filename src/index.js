import debug from "debug"
import t from "transducers.js"

import * as functions from "./functions"


const BIRYANI = "biryani.js"


// Protocol constants

const INIT = "@@transducer/init"
const RESULT = "@@transducer/result"
const STEP = "@@transducer/step"
export const ERROR = "@@converter/error"
export const VALUE = "@@converter/value"


// Converters internals

export class ConversionError extends Error {
  constructor(converted) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = `Conversion failed: ${JSON.stringify(converted[ERROR])} for ${JSON.stringify(converted[VALUE])}`
    this.converted = converted
  }
}

export class Converted {
  constructor(value, error = null) {
    this[ERROR] = error
    this[VALUE] = value
  }
}

export const converted = (value, error = null) => new Converted(value, error)
export const isConverted = (value) => value instanceof Converted
export const ensureConverted = (value) => isConverted(value) ? value : converted(value)

export const arrayConvertedReducer = (xfError) => {
  let indexCounter = 0
  const xfValue = t.arrayReducer
  const log = debug(`${BIRYANI}:transformers:arrayConvertedReducer`)
  return {
    [INIT]: () => {
      const value = xfValue[INIT]()
      const error = xfError[INIT]()
      const accumulator = converted(value, error)
      log("%s returns %j", INIT, accumulator)
      return accumulator
    },
    [RESULT]: (accumulator) => {
      const result = converted(
        xfValue[RESULT](accumulator[VALUE]),
        xfError[RESULT](accumulator[ERROR]),
      )
      log("%s returns %j", RESULT, result)
      return result
    },
    [STEP]: (accumulator, input) => {
      log("%s(%s) accumulator: %j input: %j", STEP, indexCounter, accumulator, input)
      input = ensureConverted(input)
      xfValue[STEP](accumulator[VALUE], input[VALUE])
      const error = input[ERROR]
      if (error) {
        xfError[STEP](accumulator[ERROR], [indexCounter, error])
      }
      indexCounter++
      log("%s(%s) returns %j", STEP, indexCounter, accumulator)
      return accumulator
    },
  }
}

export const objectConvertedReducer = (xfError) => {
  const xfValue = t.objReducer
  const log = debug(`${BIRYANI}:transformers:objectConvertedReducer`)
  return {
    [INIT]: () => {
      const value = xfValue[INIT]()
      const error = xfError[INIT]()
      const accumulator = converted(value, error)
      log("%s returns %j", INIT, accumulator)
      return accumulator
    },
    [RESULT]: (accumulator) => {
      const result = converted(
        xfValue[RESULT](accumulator[VALUE]),
        xfError[RESULT](accumulator[ERROR]),
      )
      log("%s returns %j", RESULT, result)
      return result
    },
    [STEP]: (accumulator, input) => {
      log("%s accumulator: %j input: %j", STEP, accumulator, input)
      input = t.transduce(input, arrayConvertedReducer, t.arrayReducer)
      xfValue[STEP](accumulator[VALUE], input[VALUE])
      const error = input[ERROR][0]
      if (error) {
        xfError[STEP](accumulator[ERROR], [input[VALUE][0], error[1]])
      }
      log("%s returns %j", STEP, accumulator)
      return accumulator
    },
  }
}

export const mapByKey = (converterByKey, {other = null} = {}) => t.map(([k, v]) => {
  const converter = converterByKey[k] || other
  if (!converter) {
    throw new Error(
      `Converter not found for key "${k}" among ${JSON.stringify(Object.getOwnPropertyNames(converterByKey))}`
    )
  }
  return [k, converter(v)]
})

export const mapKeyValue = (keyConverter, valueConverter) => t.map(([k, v]) => [keyConverter(k), valueConverter(v)])


// Top-level API

export const convert = (coll, xf) => {
  const log = debug(`${BIRYANI}:convert`)
  let result
  if (coll === null) {
    result = converted(null, null)
  } else if (functions.isArray(coll)) {
    result = t.transduce(coll, xf, arrayConvertedReducer(t.objReducer))
  } else if (functions.isObject(coll)) {
    result = t.transduce(coll, xf, objectConvertedReducer(t.objReducer))
  } else {
    result = converted(coll, "Sequence expected")
  }
  if (result[ERROR] && Object.getOwnPropertyNames(result[ERROR]).length === 0) {
    result[ERROR] = null
  }
  log("returns %j", result)
  return result
}

export const pipe = (...funcs) => {
  const log = debug(`${BIRYANI}:pipe`)
  return (value) => funcs.reduce((accumulator, f, index) => {
    accumulator = ensureConverted(accumulator)
    log("index: %s, accumulator: %j", index, accumulator, f)
    const converted = accumulator[ERROR] ? accumulator : f(accumulator[VALUE])
    log("returns %j", converted)
    return converted
  }, value)
}

export const structuredMapping = (converterByKey, options) => (coll) => convert(coll, mapByKey(converterByKey, options))

export const toValue = (converted) => {
  if (converted[ERROR]) {
    throw new ConversionError(converted)
  } else {
    return converted[VALUE]
  }
}

export const uniformMapping = (keyConverter, valueConverter) => (coll) =>
  convert(coll, mapKeyValue(keyConverter, valueConverter))

export const uniformSequence = (...converters) => (coll) => convert(coll, t.map(pipe(...converters)))


// Converters
// (value) => converted
// (...args) => (value) => converted

export const add = (n) => (value) => converted(value === null ? null : value + n, null)

export const test = (predicate, error = "Test failed") => (value) =>
  value === null ? converted(null, null) : converted(value, predicate(value) ? null : error)

export const testInteger = test(functions.isInteger, "Integer expected")

export const testString = test((value) => typeof value === "string", "String expected")

export const testPropertyEquals = (propName, expectedValue,
  error = `value[${propName}] == ${expectedValue} expected`) => test((value) => value[propName] == expectedValue, error)

export const testLength = (length) => testPropertyEquals("length", length, `value.length == ${length} expected`)

export const testNotNull = (value) => converted(value, value === null ? "Not null expected" : null)
