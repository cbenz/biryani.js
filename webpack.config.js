module.exports = {
  entry: "./src/index.js",
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
  // externals: {
    // "react": "React"
  // }
}
