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

export const convertedReducer = (xfValue, xfError) => {
  if (!xfError) {
    // TODO Set according to xfValue
    xfError = t.objReducer
  }
  let indexCounter = 0
  const normalize = (accumulator) => {
    const error = accumulator[ERROR]
    if (Object.getOwnPropertyNames(error).length === 0) {
      accumulator[ERROR] = null
    }
    return accumulator
  }
  return {
    [INIT]: () => {
      const value = xfValue[INIT]()
      const error = xfError[INIT]()
      const accumulator = converted(value, error)
      logXf(INIT, "returns", accumulator)
      return accumulator
    },
    [RESULT]: (accumulator) => {
      const result = normalize(accumulator)
      logXf(RESULT, "returns", result)
      return result
    },
    [STEP]: (accumulator, input) => {
      logXf(STEP, indexCounter, accumulator, input)
      input = ensureConverted(input)
      xfValue[STEP](accumulator[VALUE], input[VALUE])
      const error = input[ERROR]
      if (error) {
        xfError[STEP](accumulator[ERROR], [indexCounter, error])
      }
      indexCounter++
      logXf(STEP, "returns", accumulator)
      return accumulator
    },
  }
}

export const arrayConvertedReducer = () => convertedReducer(t.arrayReducer, t.objReducer)
export const objectConvertedReducer = () => convertedReducer(t.objReducer, t.objReducer)

export const seq = (coll, xf, {valueOnly = false} = {}) => {
  let converted
  if (Array.isArray(coll)) {
    converted =t.transduce(coll, xf, arrayConvertedReducer())
  } else if (isObject(coll)) {
    converted = t.transduce(coll, xf, objectConvertedReducer())
  } else {
    throw new TypeError(`Unsupported coll ${coll}`)
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
  [INIT]: () => xf[INIT](),
  [RESULT]: (accumulator) => xf[RESULT](accumulator),
  [STEP]: (accumulator, input) => {
    input = ensureConverted(input)
    // TODO Extract error check into a dedicated transformer and use t.map from caller
    xf[STEP](accumulator, input[ERROR] ? input : (
      input[VALUE] === null ? null : f(input[VALUE])
    ))
    return accumulator
  },
})

// TODO
// export const byKey = (f) => (xf) => converter(t.map(f), xf)


// Scalar converters

export const test = (predicate, error = "test failed") => (value) => converted(value, predicate(value) ? null : error)
export const testInteger = test(Number.isInteger, "Not an integer")
export const testPropertyEquals = (propName, expectedValue, error = `value[${propName}] != ${expectedValue}`) =>
  test((value) => value[propName] == expectedValue, error)
export const testLengthOf = (length) => testPropertyEquals("length", length, `value.length != ${length}`)
