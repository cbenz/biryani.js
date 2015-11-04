import "babel/polyfill"
import * as tr from "transduce" // eslint-disable-line
// import * as util from "transduce/lib/util"

import {createLogger} from "../src/logging" // eslint-disable-line
import * as b from "../src/index" // eslint-disable-line
import protocols from "../src/protocols"

const {error: cError, value: cValue} = protocols.converter // eslint-disable-line


const log = createLogger("browser") // eslint-disable-line
localStorage.debug = "biryani.js:*"
// localStorage.debug = ""


// Mock expect API to allow copy-pasting tests

// const expect = (...args) => { // eslint-disable-line
//   console.log(...args)
//   return {toEqual: functions.identity}
// }

// Code to be executed in browser console, see README.md

const converter = b.structuredObject({
  age: b.pipe(
    b.testInteger,
    b.test((value) => value >= 18, "Adult expected"),
  ),
  name: b.pipe(
    b.testString,
    (value) => "Crazy " + value,
  ),
  likes: b.uniformArray(
    b.test((value) => value.endsWith("ing"), "-ing suffix expected"),
    (value) => value + "-ding",
  ),
  parents: b.uniformObject(
    b.test((key) => ["father", "mother"].includes(key), "father or mother expected"),
    (value) => value + value.slice(-1) + "y",
  ),
})


const person = {
  age: 20,
  name: "Bob",
  likes: ["swimming", "reading", "running"],
  parents: {
    father: "Dad",
    mother: "Mum",
  },
}
const badPerson1 = {
  age: 20,
  name: "Bob",
  likes: ["swimming", "read", "running"],
  parents: {
    father: "Dad",
    mother: "Mum",
  },
}
const badPerson2 = {
  age: 12,
  name: "Bob",
  likes: ["swimming", "read", "running"],
  parents: {
    father: "Dad",
    mother: "Mum",
    brother: "Bro",
  },
}
const badPerson3 = {
  age: [12],
  name: {a: "Bob"},
  likes: 1,
  parents: 1,
}

// console.log(1, converter("x"))
// console.log(2, converter([]))
// console.log(3, converter(["x"]))
// console.log(4, converter({}))
// console.log(5, converter(person))
// console.log(6, converter(badPerson1))
// console.log(7, converter(badPerson2))
// console.log(8, converter(badPerson3))



const add2 = b.pipeLog("add2")(
  b.add("X"),
  (value) => b.isInteger(value) ? value : b.parseInt(value),
  b.add(2),
)

// console.log(11, add2(1))
// console.log(12, add2("1"))
// console.log(13, add2("x"))
// console.log(14, add2(["x"]))

const add2arrayitems = b.whileSuccessMap(add2)

// console.log(21, add2arrayitems([1, 2, 3]))

const add2arrayitemstake2 = b.whileSuccessLog("add2arrayitemstake2")(add2arrayitems, tr.take(2))
const add2arrayitemstake2conv = b.transduceArray(add2arrayitemstake2)

const r = add2arrayitemstake2conv([1, 2, 3])
console.log(31, r)
// const value = r.value()
// for (const item of value) {
//   console.log(item)
// }
