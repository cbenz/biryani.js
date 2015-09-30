# biryani.js

Biryani is a data conversion and validation library.

It is a port of the [biryani](https://pythonhosted.org/Biryani/) Python library to JavaScript.

There are plenty of libraries to achieve data conversion and validation.
This one has some specificities:

- it's based on [transducers](http://simplectic.com/blog/2014/transducers-explained-1/) through the [transduce](https://github.com/transduce/transduce) library
- it's schema-less
- it's exception-less: errors are simply returned (but `toValue` helper throws)
- errors are structured the same way than the input data

## Getting started

Just show me the code, I'll understand!

Let's validate an object representing a person:

```javascript
// import {pipe, structuredMapping, ...} from "biryani.js"

const person1 = {age: 10, name: "Bob"} // this is input data

const validatePerson = structuredMapping({
  age: testInteger,
  name: pipe(testString, testNotNull)
})

// validatePerson is a function called a converter

console.log(validatePerson(person1))
{
  "@@converter/error": null,
  "@@converter/value": {"age": 10, "name": "Bob"}
}

```

There is no error returned. Now let's test `validatePerson` again with invalid data:

```javascript
const person2 = {age: "Hi", name: "Bob"}

console.log(validatePerson(person2))
{
  "@@converter/error": {"age": "Integer expected"},
  "@@converter/value": {"age": "Hi", "name": "Bob"}
}
```

This time there is an error "Integer expected" associated with the key "age".

When a converter returns an error,

### Errors handling

The keys `"@@converter/error"` and `"@@converter/value"` of converted objects are annoying.
The return value of `validatePerson` should be treated like this:

```javascript
// get value and error
const {value, error} = validatePerson(person2).toValueError()
console.log(value)
{"age": "Hi", "name": "Bob"}
console.log(error)
{"age": "Integer expected"},

// or get value only and throw ConversionError if there is an error
const value = validatePerson(person2).toValue()
// throws ConversionError: Conversion failed: {"age":"Integer expected"} for {"age":"Hi","name":"Bob"}
```

> "value" and "error" are conjugated in the singular by convention

When a converter returns an error, the output value is the same than the input value.

### Data conversion

Validation is a particular case of conversion: data is not transformed, only errors are returned if data is invalid.

```javascript
TODO
```

## TODO

* [ ] defer errors (ie for i18n)

## API

## Debugging a converter

When converters grow in complexity it is necessary to debug them.

TODO

## Development

### Tests

To run the tests from the command line:

```
npm run test
```

### Develop with browser devtools

Since the browsers have convinient debuggers, I like to develop in the browser using the developer tools:

* open the file `./src/browser.js` in your editor
* run `webpack-dev-server`:
  ```
  npm run dev
  ```
* open this URL in your browser: http://localhost:8080/webpack-dev-server/browser
* open the developer tools (F12 in most browsers), in particular the console

To run the tests within the browser developer tools:

* open this URL in your browser: http://localhost:8080/webpack-dev-server/test
