import debug from "debug"
import t from "transducers.js"


const logXf = debug("biryani.js:xf")


// Protocol constants

const ERROR = "@@converter/error"
const INIT = "@@transducer/init"
const RESULT = "@@transducer/result"
const STEP = "@@transducer/step"
const VALUE = "@@converter/value"


// Functional helpers (should be imported from a very basic lib)

export const add = (n) => (x) => x + n
export const identity = (x) => x


// JavaScript helpers

export const isArray = typeof Array.isArray === "function" ?
  Array.isArray :
  (obj) => toString.call(obj) == "[object Array]"
export const isObject = (x) => x instanceof Object && Object.getPrototypeOf(x) === Object.getPrototypeOf({})


// Transducers extensions

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
  return {
    [INIT]: () => {
      const value = t.arrayReducer[INIT]()
      const error = xfError[INIT]()
      const accumulator = converted(value, error)
      logXf("%s returns %j", INIT, accumulator)
      return accumulator
    },
    [RESULT]: identity,
    [STEP]: (accumulator, input) => {
      logXf("%s(%s) accumulator: %j input: %j", STEP, indexCounter, accumulator, input)
      input = ensureConverted(input)
      t.arrayReducer[STEP](accumulator[VALUE], input[VALUE])
      const error = input[ERROR]
      if (error) {
        xfError[STEP](accumulator[ERROR], [indexCounter, error])
      }
      indexCounter++
      logXf("%s(%s) returns %j", STEP, indexCounter, accumulator)
      return accumulator
    },
  }
}

export const objectConvertedReducer = (xfError) => {
  return {
    [INIT]: () => {
      const value = t.objReducer[INIT]()
      const error = xfError[INIT]()
      const accumulator = converted(value, error)
      logXf("%s returns %j", INIT, accumulator)
      return accumulator
    },
    [RESULT]: identity,
    [STEP]: (accumulator, kv) => {
      logXf("%s accumulator: %j kv: %j", STEP, accumulator, kv)
      kv = t.transduce(kv, arrayConvertedReducer, t.arrayReducer)
      t.objReducer[STEP](accumulator[VALUE], kv[VALUE])
      const error = kv[ERROR]
      if (error.length !== 0) {
        xfError[STEP](
          accumulator[ERROR],
          [
            kv[VALUE][0],
            t.transduce(error, t.map(([k, v]) => [k === 0 ? "k" : "v", v]), t.objReducer),
          ]
        )
      }
      logXf("%s returns %j", STEP, accumulator)
      return accumulator
    },
  }
}

export const seq = (coll, xf, {valueOnly = false} = {}) => {
  let converted
  if (isArray(coll)) {
    converted = t.transduce(coll, xf, arrayConvertedReducer(t.objReducer))
  } else if (isObject(coll)) {
    converted = t.transduce(coll, xf, objectConvertedReducer(t.objReducer))
  } else {
    throw new TypeError(`Unsupported collection ${coll}`)
  }
  if (Object.getOwnPropertyNames(converted[ERROR]).length === 0) {
    converted[ERROR] = null
  }
  if (valueOnly) {
    if (converted[ERROR]) {
      throw new ConversionError(converted)
    } else {
      return converted[VALUE]
    }
  } else {
    return converted
  }
}


// Compound converters

export const map = (f) => (xf) => ({
  [INIT]: xf::xf[INIT],
  [RESULT]: xf::xf[RESULT],
  [STEP](accumulator, input) {
    input = ensureConverted(input)
    xf[STEP](accumulator, input[ERROR] ? input : (
      input[VALUE] === null ? null : this::f(input[VALUE])
    ))
    return accumulator
  },
})

export const mapkv = (fk, fv) => map(([k, v]) => [fk(k), fv(v)])
export const mapseq = (xf) => map((value) => seq(value, xf))


// Scalar converters

export const test = (predicate, error = "Test failed") => (value) => converted(value, predicate(value) ? null : error)
export const testInteger = test(Number.isInteger, "Not an integer")
export const testPropertyEquals = (propName, expectedValue, error = `value[${propName}] != ${expectedValue}`) =>
  test((value) => value[propName] == expectedValue, error)
export const testLength = (length) => testPropertyEquals("length", length, `value.length != ${length}`)
