const path = require('path')

module.exports = {
  entry: './typescript-source-map-test.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'typescript-source-map-test.js',
    path: path.resolve(__dirname, 'dist', 'webpack'),
  },
}
