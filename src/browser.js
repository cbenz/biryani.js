import * as tr from "transduce" // eslint-disable-line

import * as b from "../src/index" // eslint-disable-line
import * as functions from "../src/functions" // eslint-disable-line


localStorage.debug = "biryani.js:*,transducers.js:*"


// Mock expect API to allow copy-pasting tests

const expect = (...args) => { // eslint-disable-line
  console.log(...args)
  return {toEqual: functions.identity}
}


// Code to be executed in browser console, see README.md
