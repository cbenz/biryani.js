import debug from "debug"
import t from "transducers.js"


const logReducer = debug("biryani.js:reducer")


// Biryani helpers

export const identity = (x) => x


export class Converted {
  constructor(value, error = null) {
    this["@@converter/error"] = error
    this["@@converter/value"] = value
  }
  unconvert(normalize = identity) {
    return normalize({
      error: this["@@converter/error"],
      value: this["@@converter/value"],
    })
  }
}

export const isConverted = (value) => value instanceof Converted
export const ensureConverted = (value, error = null) => isConverted(value) ? value : new Converted(value, error)
export const ensureUnconverted = (value) => isConverted(value) ? value.unconvert() : {error: null, value}


export const valuesAndErrorsReducer = () => {
  let indexCounter = 0
  const normalize = (accumulator) => {
    const error = accumulator["@@converter/error"]
    if (Object.getOwnPropertyNames(error).length === 0) {
      accumulator["@@converter/error"] = null
    }
    return accumulator
  }
  return {
    "@@transducer/init": () => {
      const accumulator = new Converted([], {})
      logReducer("@@transducer/init returns", accumulator)
      return accumulator
    },
    "@@transducer/result": (accumulator) => normalize(accumulator),
    "@@transducer/step": (accumulator, stepValue) => {
      logReducer("@@transducer/step", indexCounter, accumulator, stepValue)
      const {error, value} = stepValue.unconvert()
      accumulator["@@converter/value"].push(value)
      if (error) {
        accumulator["@@converter/error"][indexCounter] = error
      }
      indexCounter++
      logReducer("@@transducer/step returns", accumulator)
      return accumulator
    },
  }
}


// Biryani composed converters

// TODO Extract t.transduce from uniformSequence
export const uniformSequence = (xform) => (sequence) => t.transduce(sequence, t.map(xform), valuesAndErrorsReducer())


// Biryani converters

export const test = (predicate, error = "test failed") => (value) =>
  ensureConverted(value, predicate(value) ? null : error)


// Validators

export const isInteger = (value) => test(Number.isInteger, "not an integer")(value)
