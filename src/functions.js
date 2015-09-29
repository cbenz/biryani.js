// JavaScript helpers

export const isArray = typeof Array.isArray === "function" ?
  Array.isArray :
  (obj) => toString.call(obj) == "[object Array]"
export const isObject = (x) => x instanceof Object && Object.getPrototypeOf(x) === Object.getPrototypeOf({})


// Functional helpers (should be imported from a very basic lib)

export const add = (n) => (x) => x + n
export const identity = (x) => x
export const isInteger = Number.isInteger
