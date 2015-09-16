import t from "transducers.js"




const fail = (value, error = true) => ({"@@transducer/error": error, "@@transducer/value": value})
const test = (condition, error) => value => condition(value) ? value : fail(value, error)
const isInteger = t.map(x => test(Number.isInteger, "not an integer")(x))


const arrayWithErrorsReducer = () => {
  let indexCounter = 0
  return {
    // "@@transducer/init": () => [],
    "@@transducer/init": () => {
      const initialValue = {
        errors: {},
        values: [],
      }
      console.log("@@transducer/init returns", initialValue)
      return initialValue
    },
    // "@@transducer/result": (value) => value,
    "@@transducer/result": (value) => {
      const {errors, values} = value
      const result = {
        errors: Object.keys(errors).length ? errors : null,
        values,
      }
      console.log("@@transducer/result returns", result)
      return result
    },
    // "@@transducer/step": push,
    "@@transducer/step": (array, value) => {
      console.log("@@transducer/step", indexCounter, array, value)
      const error = value["@@transducer/error"]
      if (error) {
        array.errors[indexCounter] = error
        const initialValue = value["@@transducer/value"]
        console.log("@@transducer/step pushes", array.values, initialValue)
        array.values.push(initialValue)
      } else {
        console.log("@@transducer/step pushes", array.values, value)
        array.values.push(value)
      }
      indexCounter++
      return array
    },
  }
}


// Do not give empty array as last argument otherwise "@@transducer/init" will be ignored.
const validateIntegers = (value) => t.transduce(value, isInteger, arrayWithErrorsReducer())

// IN [1, 2]
// OUT [1, 2], null
console.log("================")
console.log(validateIntegers([1, 2]))

// IN [1, 2, "x"]
// OUT [1, 2, "x"], {2: "not an integer"}
console.log("================")
console.log(validateIntegers([1, 2, "x"]))
