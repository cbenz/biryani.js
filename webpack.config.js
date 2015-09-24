module.exports = {
  // devtool: "eval", // Transformed code
  devtool: "source-map", // Original code
  entry: {
    browser: "./src/browser.js",
    test: "mocha!./test/index.js",
  },
  output: {
    filename: "[name].js",
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ["babel-loader"],
      },
    ],
  },
}
