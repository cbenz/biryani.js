import t from "transducers.js"

import * as b from "./index"


// Drafts

localStorage.debug = "biryani.js:*,transducers.js:*" // eslint-disable-line

// const numbers = [1,2,null,4]
// console.log(t.seq(numbers, t.map(add(1))))
// console.log(t.seq(numbers, t.compose(
//   t.map(add(1)),
//   t.map(add(2)),
// )))
// console.log(t.seq(numbers, t.keep()))
// console.log(t.seq(numbers, map(add(1))))
// console.log(t.seq(numbers, t.compose(
//   map(add(1)),
//   map(add(2)),
// )))

// const values = [1,"x",null]
// const testAndInc = t.compose(map(testInteger), map(add(1)))
// console.log(seq(values, testAndInc))
// console.log(t.seq(values, t.map(testInteger))) // Problem: t.map does not pass over null
// console.log(t.seq(values, map(testInteger))) // Problem: t.seq does not reduce values and errors
// console.log(seq(values, map(testInteger)))
// const testOnly = t.compose(map(testInteger))
// console.log(seq(values, testOnly))
// console.log(t.seq(values, testAndInc)) // Problem: t.seq does not use convertedReducer

const points = [[1,2], null, [3,"x"]]
console.log(b.seq(points, t.compose(
  b.map(b.testLengthOf(2)),
  b.map((point) => b.seq(point, t.compose(b.map(b.testInteger), b.map(b.add(1))))),
)))
// console.log(seq(points, t.compose(
//   map(testLengthOf(2)),
//   map((point) => seq(point, t.compose(map(testInteger), map(add(1))), {valueOnly: true})),
// )), {valueOnly: true})

// console.log(t.seq(points, map(
//   (point) => t.seq(point, map(add(1))),
// )))
// console.log(t.seq(points, map(
//   (point) => t.seq(point, map(add(1))),
// )))
// console.log(t.seq(points, t.map(
//   (point) => t.seq(point, t.map(add(1))),
// ))) // Fails
// console.log(t.transduce(points, t.map((value) =>
//   t.compose(
//     t.map(Number.isInteger),
//     t.map((value) => value > 0),
//   )
// ), t.arrayReducer))
