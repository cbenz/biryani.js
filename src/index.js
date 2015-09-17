import debug from "debug"
import t from "transducers.js"


const logReducer = debug("biryani.js:reducer")


const arrayWithErrorsReducer = () => {
  let indexCounter = 0
  return {
    "@@transducer/init": () => {
      const initialValue = {
        errors: {},
        values: [],
      }
      logReducer("@@transducer/init returns", initialValue)
      return initialValue
    },
    "@@transducer/result": (value) => {
      const {errors, values} = value
      const result = {
        errors: Object.keys(errors).length ? errors : null,
        values,
      }
      logReducer("@@transducer/result returns", result)
      return result
    },
    "@@transducer/step": (array, value) => {
      logReducer("@@transducer/step", indexCounter, array, value)
      const error = value["@@transducer/error"]
      if (error) {
        array.errors[indexCounter] = error
        const initialValue = value["@@transducer/value"]
        logReducer("@@transducer/step pushes", array.values, initialValue)
        array.values.push(initialValue)
      } else {
        logReducer("@@transducer/step pushes", array.values, value)
        array.values.push(value)
      }
      indexCounter++
      return array
    },
  }
}


// Biryani helpers

const wrapValueAndError = (value, error = true) => ({"@@transducer/error": error, "@@transducer/value": value})
const test = (predicate, error = "test failed") => (value) => predicate(value) ? value : wrapValueAndError(value, error)


// Biryani converters

const uniformSequence = (xform) => (sequence) => t.transduce(sequence, t.map(xform), arrayWithErrorsReducer())


// Custom functions

const isInteger = (value) => test(Number.isInteger, "not an integer")(value)
const validateIntegers = (sequence) => uniformSequence(isInteger)(sequence)


// Tests

const logTest = debug("biryani.js:test")

// IN [1, 2]
// OUT [1, 2], null
logTest(validateIntegers([1, 2]))

// IN [1, 2, "x"]
// OUT [1, 2, "x"], {2: "not an integer"}
logTest(validateIntegers([1, 2, "x"]))
