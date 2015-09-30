import {map} from "transduce/transducers"
import * as tr from "transduce/core"
import * as util from "transduce/lib/util"
import createLog from "debug"

import * as functions from "./functions"


const BIRYANI = "biryani.js"


// Protocol constants

const converterProtocol = {error: "@@converter/error", value: "@@converter/value"}
export const protocols = {converter: converterProtocol}
const {init: tInit, step: tStep, result: tResult} = util.protocols.transducer
const {error: cError, value: cValue} = converterProtocol

// Converters internals

export class ConversionError extends Error {
  constructor(converted) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    const errorStr = JSON.stringify(converted[cError])
    const valueStr = JSON.stringify(converted[cValue])
    this.message = `Conversion failed: ${errorStr} for ${valueStr}`
    this.converted = converted
  }
}

export class Converted {
  constructor(value, error = null) {
    this[cError] = error
    this[cValue] = value
  }
  toValue() {
    if (this[cError]) {
      throw new ConversionError(this)
    } else {
      return this[cValue]
    }
  }
  toValueError() {
    return {value: this[cValue], error: this[cError]}
  }
}

export const converted = (value, error = null) => new Converted(value, error)
export const isConverted = (value) => value instanceof Converted
export const ensureConverted = (value) => isConverted(value) ? value : converted(value)

const arrayTransformer = tr.transformer([])
const objectTransformer = tr.transformer({})

export class ConvertedTransformer {
  constructor(xfValue, xfError) {
    this.xfValue = xfValue
    this.xfError = xfError
    this.log = createLog(`${BIRYANI}:transformers:ConvertedTransformer`)
  }
  [tInit]() {
    const value = this.xfValue[tInit]()
    const error = this.xfError[tInit]()
    const result = converted(value, error)
    this.log("init returns %j", result)
    return result
  }
  [tResult](value) {
    value = converted(
      this.xfValue[tResult](value[cValue]),
      this.xfError[tResult](value[cError]),
    )
    this.log("result returns %j", value)
    return value
  }
}

class ConvertedArrayTransformer extends ConvertedTransformer {
  constructor(xfError = objectTransformer) {
    super(arrayTransformer, xfError)
    this.index = 0
  }
  [tStep](value, input) {
    this.log("step value: %j, input: %j", value, input)
    input = ensureConverted(input)
    this.xfValue[tStep](value[cValue], input[cValue])
    const error = input[cError]
    if (error) {
      this.xfError[tStep](value[cError], [this.index, error])
    }
    this.index++
    return value
  }
}

class ConvertedObjectTransformer extends ConvertedTransformer {
  constructor(xfError = objectTransformer) {
    super(objectTransformer, xfError)
  }
  [tStep](value, input) {
    this.log("step value: %j, input: %j", value, input)
    const [inputKey, inputValue] = input.map(ensureConverted)
    this.xfValue[tStep](value[cValue], [inputKey[cValue], inputValue[cValue]])
    const error = inputKey[cError] || inputValue[cError]
    if (error) {
      this.xfError[tStep](value[cError], [inputKey[cValue], error])
    }
    return value
  }
}

export const convert = (coll, transducer) => {
  const log = createLog(`${BIRYANI}:convert`)
  if (coll === null) {
    return converted(null, null)
  }
  let result
  if (functions.isArray(coll)) {
    const transformer = new ConvertedArrayTransformer()
    result = tr.transduce(transducer, transformer, coll)
  } else if (functions.isObject(coll) || functions.isIterator(coll)) {
    const transformer = new ConvertedObjectTransformer()
    result = tr.transduce(transducer, transformer, coll)
  } else {
    return converted(coll, "Sequence expected")
  }
  if (result[cError] && Object.getOwnPropertyNames(result[cError]).length === 0) {
    result[cError] = null
  }
  log("returns %j", result)
  return result
}

export const mapByKey = (converterByKey, {other = null} = {}) => map(([k, v]) => {
  const converter = converterByKey[k] || other
  if (!converter) {
    throw new Error(
      `Converter not found for key "${k}" among ${JSON.stringify(Object.getOwnPropertyNames(converterByKey))}`
    )
  }
  return [k, converter(v)]
})

export const mapKeyValue = (keyConverter, valueConverter) => map(([k, v]) => [keyConverter(k), valueConverter(v)])


// Compound converters
// (...converters) => (coll) => converted

export const pipe = (...converters) => {
  const log = createLog(`${BIRYANI}:pipe`)
  return (value) => converters.reduce((accumulator, converter, index) => {
    accumulator = ensureConverted(accumulator)
    log("index: %s, accumulator: %j", index, accumulator, converter)
    const converted = accumulator[cError] ? accumulator : converter(accumulator[cValue])
    log("returns %j", converted)
    return converted
  }, value)
}

export const structuredMapping = (converterByKey, options) => (coll) => convert(coll, mapByKey(converterByKey, options))

export const structuredSequence = (converters) => (coll) =>
  convert(functions.zip(coll, converters), map(([value, converter]) => converter(value)))

export const uniformMapping = (keyConverter, valueConverter) => (coll) =>
  convert(coll, mapKeyValue(keyConverter, valueConverter))

export const uniformSequence = (...converters) => {
  if (converters.length === 0) {
    throw new Error("No converters given")
  }
  return (coll) => convert(coll, map(converters.length === 1 ? converters[0] : pipe(...converters)))
}


// Converters
// (value) => converted
// (...args) => (value) => converted

export const add = (n) => (value) => converted(value === null ? null : value + n, null)

export const test = (predicate, error = "Test failed") => (value) =>
  value === null ? converted(null, null) : converted(value, predicate(value) ? null : error)

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

export const testInteger = test(functions.isInteger, "Integer expected")

export const testString = test((value) => typeof value === "string", "String expected")

export const testPropertyEquals = (propName, expectedValue,
  error = `value[${propName}] == ${expectedValue} expected`) => test((value) => value[propName] == expectedValue, error)

export const testLength = (length) => testPropertyEquals("length", length, `value.length == ${length} expected`)

export const testNotNull = (value) => converted(value, value === null ? "Not null expected" : null)

export const toInteger = (value) => converted(value === null ? null : Number(value), null)


// Converters for debugging

export function debug(value) {
  debugger
  return value
}

const logTap = createLog(`${BIRYANI}:converters:tap`)
export function tap(value) {
  logTap(value)
  return value
}
