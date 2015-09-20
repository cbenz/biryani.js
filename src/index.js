import debug from "debug"
import t from "transducers.js"


const logXf = debug("biryani.js:xf")

const ERROR = "@@converter/error"
const INIT = "@@transducer/init"
const NAME = "@@converter/name"
const RESULT = "@@transducer/result"
const STEP = "@@transducer/step"
const VALUE = "@@converter/value"

// Biryani helpers

export const identity = (x) => x
export const inc = (x) => x + 1


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
    // TODO Implement with classes!
    [NAME]: "convertedReducer",
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


// Biryani composed converters

export const arrayConvertedReducer = () => convertedReducer(t.arrayReducer, t.objReducer)

// export const converter = (xf1, xf2) => {
//   if (xf2[NAME] !== "convertedReducer") {
//     xf2 = convertedReducer(xf2)
//   }
//   return xf1(xf2)
// }
// export const map = (f) => (xf) => converter(t.map(f), xf)

export const map = (f) => (xf) => t.map((value) => value === null ? null : f(value))(xf)

// export const byKey = (f) => (xf) => converter(t.map(f), xf)


// Biryani converters

export const test = (predicate, error = "test failed") => (value) =>
  converted(value, value === null ? null : predicate(value) ? null : error)
export const testInteger = test(Number.isInteger, "not an integer")

export const convert = (value, xf) => {
  if (value === null) {
    return converted(null, null)
  }
  // TOOD Set reducer according to value type
  const reducer = arrayConvertedReducer()
  return t.transduce(value, xf, reducer)
}

export class ConversionError extends Error {
  constructor(converted) {
    super(`Conversion failed: ${JSON.stringify(converted[ERROR])} for ${JSON.stringify(converted[VALUE])}`)
    this.converted = converted
  }
}

export const convertOrThrow = (value, xf) => {
  const converted = convert(value, xf)
  if (converted[ERROR]) {
    throw new ConversionError(converted)
  } else {
    return converted[VALUE]
  }
}


// console.log(convert([[null]], map(map(testInteger))))
