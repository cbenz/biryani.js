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
