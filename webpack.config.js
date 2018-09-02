const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/neo.ts',
  output: {
    filename: 'neo.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: 'ts-loader' }]
  },
  target: "node",
}
