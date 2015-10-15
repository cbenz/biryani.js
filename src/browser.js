import "babel/polyfill"
import * as tr from "transduce" // eslint-disable-line
// import * as util from "transduce/lib/util"

import {createLog} from "../src/logging" // eslint-disable-line
import * as b from "../src/index" // eslint-disable-line
import * as functions from "../src/functions" // eslint-disable-line
import protocols from "../src/protocols"

const {error: cError, value: cValue} = protocols.converter // eslint-disable-line


const log = createLog("browser") // eslint-disable-line
// localStorage.debug = "biryani.js:*"
localStorage.debug = ""


// Mock expect API to allow copy-pasting tests

// const expect = (...args) => { // eslint-disable-line
//   console.log(...args)
//   return {toEqual: functions.identity}
// }

// Code to be executed in browser console, see README.md

// const transducer = tr.map(([key, value]) => {
//   const converterByKey = {
//     age: b.pipe(
//       b.testInteger,
//       (value) => value >= 18,
//     ),
//     name: (value) => "Crazy " + value,
//     likes: b.pipe(
//       b.testArray,
//       (value) => tr.transduce(
//         tr.compose(
//           tr.take(2),
//           tr.map(b.test((value) => value.endsWith("ing"), "-ing suffix expected")),
//         ),
//         new b.ConvertedArrayTransformer(),
//         value,
//       ),
//     ),
//     parents: b.pipe(
//       b.testObject,
//       (value) => tr.transduce(
//         tr.map(
//           ([key, value]) => [
//             b.test((key) => ["father", "mother"].includes(key), "father or mother expected"),
//             value,
//           ],
//         ),
//         new b.ConvertedObjectTransformer(),
//         value,
//       ),
//     ),
//   }
//   const converter = converterByKey[key]
//   const output = converter ? converter(value) : value
//   return [key, output]
// })

// const converter = (value) => tr.transduce(transducer, new b.ConvertedObjectTransformer(), value)

// const output1 = b.convert(converter, person)
// console.log(output1)
//
// const output2 = b.convert(converter, badPerson)
// console.log(output2)

const converter = b.mapObjectByKey({
  // age: (value) => tr.transduce(
  //   tr.map(b.testInteger),
  //   expectSingleValue,
  //   [value],
  // ),
  // age: (value) => tr.transduce(
  //     b.pipe(
  //       b.testInteger,
  //       b.test((value) => value >= 18, "Adult expected"),
  //     ),
  //   expectSingleValue,
  //   [value],
  // ),
  age: b.transduceValue(
    b.pipe(
      b.testInteger,
      b.test((value) => value >= 18, "Adult expected"),
    ),
  ),
  // name: b.pipe(
  //   b.testString,
  //   (value) => "Crazy " + value,
  // ),
  // name: b.pipe(
  //   b.testString,
  //   (value) => "Crazy " + value,
  // ),
  // likes: b.uniformArray(
  //   b.test((value) => value.endsWith("ing"), "-ing suffix expected")
  // ),
  // likes: b.pipe(
  //   b.testArray,
  //   tr.into([], tr.filter((value) => value.endsWith("ing"))),
  // ),
  // likes: b.transduceArray(
  //   // tr.filter((value) => value.endsWith("ing")),
  //   tr.map(b.test((value) => value.endsWith("ing"), "-ing suffix expected")),
  // )
  // likes: b.transduceArray(
  //   tr.compose(
  //     b.map(b.test((value) => value.endsWith("ing"), "-ing suffix expected")),
  //     b.map((value) => value + "-ing"),
  //   )
  // ),
  // likes: b.transduceArray(
  //   tr.compose(
  //     b.ifSuccess(tr.map(b.test((value) => value.endsWith("ing"), "-ing suffix expected"))),
  //     b.ifSuccess(tr.map((value) => value + "-ding")),
  //     b.ifError(tr.drop(1)),
  //   )
  // ),
  // likes: b.transduceArray(
  //   b.whileSuccess(
  //     tr.map(b.test((value) => value.endsWith("ing"), "-ing suffix expected")),
  //     tr.map((value) => value + "-ding"),
  //   ),
  // ),
  // likes: b.transduceArray(
  //   b.pipe(
  //     b.test((value) => value.endsWith("ing"), "-ing suffix expected"),
  //     (value) => value + "-ding",
  //   ),
  // ),
  // likes: (value) => tr.transduce(
  //   tr.map(b.testArray),
  //   expectSingleValue,
  //   [value],
  // ),
  // likes: (value) => b.transduceArray(
  //   b.pipe(
  //     b.test((value) => value.endsWith("ing"), "-ing suffix expected"),
  //     (value) => value + "-ding",
  //   ),
  // )(
  //   tr.transduce(
  //     tr.map(b.testArray),
  //     expectSingleValue,
  //     [value],
  //   )
  // ),
  likes: b.mapArray(
    b.test((value) => value.endsWith("ing"), "-ing suffix expected"),
    (value) => value + "-ding",
  ),
  parents: b.mapObject(
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


console.log(converter(person))
console.log(converter(badPerson1))
console.log(converter(badPerson2))
console.log(converter(badPerson3))
