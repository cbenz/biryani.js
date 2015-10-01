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

// log(b.pipe(b.testInteger, b.toInteger)("x"))
log(b.toInteger("x"))
log(b.toInteger([1]))
debugger

import {pipe, structuredMapping, test, testBetween, testInteger, testNotNull, testString, uniformSequence} from "../src/index" // eslint-disable-line

const {error: cError, value: cValue} = b.protocols.converter // eslint-disable-line

const person = { // eslint-disable-line
  age: 10,
  name: "Bob",
  // parents: ["a", "b", "c"],
  // parents: ["a", "b"],
  parents: "ab",
}
// const person2 = {age: "10", name: "Bob"}

const validatePerson = structuredMapping({
  age: b.toInteger,
  name: pipe(testString, testNotNull),
  parents: pipe(
    test((parents) => testBetween(1, 2)(parents.length)),
    // uniformSequence(
    //   testString,
    //   // emptyToNull
    //   test((value) => value.length > 0, "not empty expected"),
    //   (value) => `${value} benz`,
    // ),
    // b.debug,
    // (parents) => {parents.push("3eme"); return parents}
    // (parents) => tr.sequence(tr.array.push("xxx"), parents), // no: lazy
    // (parents) => tr.into([], tr.array.push("xxx"), parents),
    tr.into("", tr.array.push("xxx")),
  ),
})
log(validatePerson(person))
// debugger
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
