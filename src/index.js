import debug from "debug"
import t from "transducers.js"


const logReducer = debug("biryani.js:reducer")


// Biryani helpers

const wrapValueAndError = (value, error = true) => ({"@@transducer/error": error, "@@transducer/value": value})
const unwrapValueAndError = (value) => {
  const error = value["@@transducer/error"]
  return error ? {error, value: value["@@transducer/value"]} : {value}
}


const valuesAndErrorsReducer = () => {
  let indexCounter = 0
  return {
    "@@transducer/init": () => {
      const accumulator = {
        errors: {},
        values: [],
      }
      logReducer("@@transducer/init returns", accumulator)
      return accumulator
    },
    "@@transducer/result": (accumulator) => {
      const {errors, values} = accumulator
      const result = {
        errors: Object.keys(errors).length ? errors : null,
        values,
      }
      logReducer("@@transducer/result returns", result)
      return result
    },
    "@@transducer/step": (accumulator, stepValue) => {
      const {error, value} = unwrapValueAndError(stepValue)
      logReducer("@@transducer/step", indexCounter, accumulator, stepValue, value, error)
      if (error) {
        accumulator.errors[indexCounter] = error
      }
      accumulator.values.push(value)
      indexCounter++
      logReducer("@@transducer/step returns", accumulator)
      return accumulator
    },
  }
}


// Biryani composed converters

// TODO Extract t.transduce from uniformSequence
const uniformSequence = (xform) => (sequence) => t.transduce(sequence, t.map(xform), valuesAndErrorsReducer())


// Biryani converters

const test = (predicate, error = "test failed") => (value) => predicate(value) ? value : wrapValueAndError(value, error)
const isInteger = (value) => test(Number.isInteger, "not an integer")(value)


// Custom functions

const validateIntegerSequence = (sequence) => uniformSequence(isInteger)(sequence)


// Tests

const logTest = debug("biryani.js:test")

// IN [1, 2]
// OUT [1, 2], null
logTest(validateIntegerSequence([1, 2]))

// IN [1, 2, "x"]
// OUT [1, 2, "x"], {2: "not an integer"}
logTest(validateIntegerSequence([1, 2, "x"]))
