import * as tr from "transduce" // eslint-disable-line
import debug from "debug"

import * as b from "../src/index" // eslint-disable-line
import * as functions from "../src/functions" // eslint-disable-line


const log = debug("biryani.js:browser")
localStorage.debug = "biryani.js:*"


// Mock expect API to allow copy-pasting tests

const expect = (...args) => { // eslint-disable-line
  console.log(...args)
  return {toEqual: functions.identity}
}


// Code to be executed in browser console, see README.md

import {pipe, structuredMapping, test, testBetween, testInteger, testNotNull, testString, uniformSequence} from "../src/index" // eslint-disable-line

const {error: cError, value: cValue} = b.protocols.converter

const person = {
  age: 10,
  name: "Bob",
  // parents: ["a", "b", "c"],
  parents: ["a", "b"],
}

const validatePerson = structuredMapping({
  age: b.toInteger,
  name: pipe(testString, testNotNull),
  parents: pipe(
    test((parents) => testBetween(1, 2)(parents.length)),
    uniformSequence(
      testString,
      test((value) => value.lenght > 2),
    ),
  ),
})
const person2 = {age: "10", name: "Bob"}
log(validatePerson(person2))
debugger
// const value = b.toValue(result)
// const value = result[cValue], error = result[cError]
// const {value, error} = {value: result[cValue], error: result[cError]}
// const {value, error} = b.toValueError(result)
//
// const input = [1, 99, 2]
// const find99 = tr.array.find((item) => item === 99)
// // [tr.protocols.transducer.step]
// // const conv = b.uniformSequence(find99)
// // console.log(conv(input))
// console.log(b.convert(input, find99))
