module.exports = {
  // devtool: "eval", // Transformed code
  devtool: "source-map", // Original code
  entry: "./src/browser.js",
  output: {
    filename: "biryani.js",
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
