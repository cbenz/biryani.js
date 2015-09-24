# biryani.js

Experimentation around data conversion and validation using transducers.

Port of [biryani](https://pythonhosted.org/Biryani/) Python library in JavaScript.

Based on the [transducers.js](https://github.com/jlongster/transducers.js) library, but may be compatible with others.

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
