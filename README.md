# biryani.js

biryani.js is a data conversion and validation library.

It is a port of the [biryani](https://pythonhosted.org/Biryani/) Python library to JavaScript.

There are plenty of libraries to achieve data conversion and validation.
This one has some specificities:

- it's based on [transducers](http://simplectic.com/blog/2014/transducers-explained-1/) through the [transduce](https://github.com/transduce/transduce) library
- it's schema-less
- it's exception-less: errors are simply returned (but `toValue` helper throws)
- errors are structured the same way than the input data

## Quick start

Just show me the code, I'll understand!

```javascript
const toPerson = structuredMapping({
  age: testInteger,
  name: pipe(testString, testNotNull)
})
const person = {age: "Hi", name: "Bob"}

toPerson(person).toValueError()
{
  value: {"age": "Hi", "name": "Bob"},
  error: {"age": "Integer expected"}
}
```

Now read the tutorial!

## Tutorial

For a first taste say we need to convert a value representing an integer (ie the age of a person) to an integer.
This value is a string because the someone typed it in a UI.

In vanilla JavaScript there is the `parseInt` function:

```javascript
parseInt("1")
1
```

What happens if the user types `"x"`?

```javascript
parseInt("x")
NaN
```

The `parseInt` function returns `NaN` (Not a Number) but could have thrown an exception or returned `undefined`.
JavaScript is not a super-consistent language :)

We would better receive an error string and a value. biryani.js provide such *converters*.
There is a converter named `toInteger`:

```javascript
b.toInteger("1").toValueError()
{value: 1, error: null}

b.toInteger("x").toValueError()
{value: "x", error: "Integer representation expected"}
```

> In this tutorial we assume that biryani.js is imported as `b`:
>
> ```javascript
> import * as b from "biryani.js"
> ```

There are many other converters shipped with biryani.js.

`testInteger` validates data but `toInteger` converts data. Let's compare them:

```javascript
b.testInteger("1").toValueError()
{value: "1", error: "Integer expected"} // notice the value is not converted

b.toInteger("1").toValueError()
{value: 1, error: null}
```

Say we want to validate an object representing a person:

```javascript
const person = {age: "10", name: "Bob"}
```

We want to check that the "age" key is an integer and that the "name" key is a string and is not null.

Let's use the `structuredMapping` converter which takes an object describing which converter to apply to each key:

```javascript
let toPerson = b.structuredMapping({
  age: b.toInteger,
  name: b.pipe(b.testString, b.testNotNull)
})
```

`structuredMapping` can be called a *converter creator* because it returns a function.
And this function is a converter itself!

```javascript
toPerson(person).toValueError()
{
  value: {"age": 10, "name": "Bob"},
  error: null
}
```

No error is returned. Now let's call our `toPerson` converter again with invalid data:

```javascript
const invalidPerson = {age: "Hi", name: "Bob"}

toPerson(invalidPerson).toValueError()
{
  value: {"age": "Hi", "name": "Bob"},
  error: {"age": "Integer representation expected"}
}
```

This time an error is returned: "Integer representation expected".
Notice that the error message is associated with the key "age".
Since there is an error, the input value is returned.
This allows us to display a neat error message to the user (think of a web form...).

So every developer can create custom converters and assemble them together with biryani.js converters.

Let's enhance the converter to check the age is between 0 and 150:

```javascript
toPerson = b.structuredMapping({
  age: b.pipe(b.toInteger, b.testBetween(0, 150)),
  name: b.pipe(b.testString, b.testNotNull)
})
```

Here we introduced a new converter `pipe` which executes its given converters sequentially and stops when one hits an error.

The interesting thing is that we can parametrize a converter by transforming it into a function, a converter creator.
This is very easy in JavaScript using the arrow function notation:

```javascript
toPerson = (minAge, maxAge) => b.structuredMapping({
  age: b.pipe(b.toInteger, b.testBetween(minAge, maxAge)),
  name: b.pipe(b.testString, b.testNotNull)
})

toAdult = toPerson(18, 150) // as the french law says :)
```

Quick test:

```javascript
const kid = {"age": "10", "name": "Bob"},

toAdult(kid)
{
  value: {"age": "10", "name": "Bob"},
  error: {"age": "18 <= value <= 150 expected"}
}
```

One level higher: say we want to convert an array of persons.

```javascript
const persons = [
  {age: 10, name: "Bob"},
  {age: "Hey", name: "Mario"},
]
```

To convert arrays we'll use the `uniformSequence` converter which applies the same converter to each item of the array.
Let's also reuse our previous `toPerson` converter:

```javascript
const toPersons = b.uniformSequence(toPerson)

toPersons(persons)
{
  value: [
    {age: 10, name: "Bob"},
    {age: "Hey", name: "Mario"},
  ],
  error: {1: {age: "Integer representation expected"}}
}
```

Again, the error is structured like the input value: we see that the error concerns the item of index 1 in the array.

## TODO

* [ ] defer collections realization
* [ ] defer errors (ie for i18n)

## API

## Design choices

Converters sometimes choose not to follow JavaScript [strange](http://wtfjs.com/)
[behavior](http://charlieharvey.org.uk/page/javascript_the_weird_parts):

```javascript
parseInt([1]) => 1 // what?
b.toInteger([1]) => {
  "@@converter/value": [1],
  "@@converter/error": "Integer representation expected"
}
```


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
