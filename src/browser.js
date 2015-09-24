import t from "transducers.js"

import * as b from "../src/index"

localStorage.debug = "biryani.js:*,transducers.js:*"


// Code to be executed in browser console, see README.md

console.log(t)
console.log(b)

const person = {age: "Bob", weight: 20}
console.log(b.seq(person, b.mapkv(b.identity, b.testInteger)))
