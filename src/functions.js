import * as tr from "transduce/core"
import * as t from "transduce/transducers"


// JavaScript helpers

export const isArray = typeof Array.isArray === "function" ?
  Array.isArray :
  (value) => toString.call(value) == "[object Array]"
export const isObject = (value) => value instanceof Object && Object.getPrototypeOf(value) === Object.getPrototypeOf({})
export const isIterator = (value) => value[Symbol.iterator] || value.next
export const isScalar = (value) => (/string|number|boolean/).test(typeof value)
export const isString = (value) => typeof value === "string"


// Functional helpers (should be imported from a very basic lib)

export const add = (n) => (x) => x + n
export const identity = (x) => x
export const isInteger = Number.isInteger

export const interpose = (separator, {wrap = false} = {}) => (coll) => {
  let coll2 = tr.into([], t.interpose(separator), coll)
  if (wrap) {
    coll2 = [separator, ...coll2, separator]
  }
  return coll2
}

export const tap = (interceptor) => (value) => {
  interceptor(value)
  return value
}
