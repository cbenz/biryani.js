# biryani.js

Experimentation around data conversion and validation using transducers.

Port of [biryani](https://pythonhosted.org/Biryani/) Python library in JavaScript.

Based on the [transduce](https://github.com/transduce/transduce) library, but may be compatible with others.

## Examples

Just show me the code, I'll understand!

```javascript
import {pipe, structuredMapping, testInteger, testNotNull, testString} from "biryani.js"
```

Let's validate an object representing a person:

```javascript
const person1 = {age: 10, name: "Bob"}

const validatePerson = structuredMapping({
  age: testInteger,
  name: pipe(testString, testNotNull)
})

console.log(validatePerson(person1))
{
  "@@converter/error": null,
  "@@converter/value": {"age": 10, "name": "Bob"}
}
```

> `"@@converter/error"` and `"@@converter/value"` are symbols

Everything is OK, but let's test with invalid data:

```javascript
const person2 = {age: "Hi", name: "Bob"}

console.log(validatePerson(person2))
{
  "@@converter/error": {"age": "Integer expected"},
  "@@converter/value": {"age": "Hi", "name": "Bob"}
}
```

See also [tests](test/index.js).

## TODO

* [ ] defer errors (ie for i18n)

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
