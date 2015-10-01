// JavaScript helpers

export const isArray = typeof Array.isArray === "function" ?
  Array.isArray :
  (x) => toString.call(x) == "[object Array]"
export const isObject = (x) => x instanceof Object && Object.getPrototypeOf(x) === Object.getPrototypeOf({})
export const isIterator = (x) => x[Symbol.iterator] || x.next
export const isScalar = (x) => (/string|number|boolean/).test(typeof x)


// Functional helpers (should be imported from a very basic lib)

export const add = (n) => (x) => x + n
export const identity = (x) => x
export const isInteger = Number.isInteger


// Utility functions

export const zip = (...collections) => collections[0].map(
  (item, idx) => collections.map((collection) => collection[idx])
)
