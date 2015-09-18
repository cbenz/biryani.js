import debug from "debug"
import t from "transducers.js"


const logReducer = debug("biryani.js:reducer")

const ERROR = "@@converter/error"
const INIT = "@@transducer/init"
const RESULT = "@@transducer/result"
const STEP = "@@transducer/step"
const VALUE = "@@converter/value"

// Biryani helpers

export const identity = (x) => x


export class Converted {
  constructor(value, error = null) {
    this[ERROR] = error
    this[VALUE] = value
  }
  unconvert(normalize = identity) {
    return normalize({
      error: this[ERROR],
      value: this[VALUE],
    })
  }
}

export const isConverted = (value) => value instanceof Converted
export const ensureConverted = (value, error) => isConverted(value) ? value : new Converted(value, error)
export const ensureUnconverted = (value) => isConverted(value) ? value.unconvert() : {error: null, value}

export const convertedReducer = (valueXform, errorXform) => {
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
      const value = valueXform[INIT]()
      const error = errorXform[INIT]()
      const accumulator = new Converted(value, error)
      logReducer(INIT, "returns", accumulator)
      return accumulator
    },
    [RESULT]: (accumulator) => normalize(accumulator),
    [STEP]: (accumulator, stepValue) => {
      logReducer(STEP, indexCounter, accumulator, stepValue)
      const {error, value} = stepValue.unconvert()
      valueXform[STEP](accumulator[VALUE], value)
      if (error) {
        errorXform[STEP](accumulator[ERROR], [indexCounter, error])
      }
      indexCounter++
      logReducer(STEP, "returns", accumulator)
      return accumulator
    },
  }
}


// Biryani composed converters

export const stopNullValue = (value, converter) => value === null ? ensureConverted(null, null) : converter(value)

// TODO Extract t.transduce from uniformSequence
// export const uniformSequence = (itemXform) => (sequence) =>
//   t.transduce(sequence, t.map(itemXform), convertedReducer(t.arrayReducer, t.objReducer))

// export const uniformSequence = (itemXform) => (sequence) => sequence !== null ?
//   t.transduce(sequence, t.map(itemXform), convertedReducer(t.arrayReducer, t.objReducer)) :
//   ensureConverted(null, null)

export const uniformSequence = (itemXform) => (sequence) => stopNullValue(
  sequence,
  (sequence) => t.transduce(sequence, t.map(itemXform), convertedReducer(t.arrayReducer, t.objReducer)),
)


// Biryani converters

export const test = (predicate, error = "test failed") => (value) => stopNullValue(
  value,
  (value) => ensureConverted(value, predicate(value) ? null : error),
)


// Validators

export const isInteger = (value) => test(Number.isInteger, "not an integer")(value)
