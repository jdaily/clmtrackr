'use strict';
const path = require('path');

module.exports = {
  entry: {
    clmtrackr: './js/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    libraryTarget: 'umd',
    library: 'clm'
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader?inline=true'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        // include: path.join(__dirname, 'src'),
        exclude: /(node_modules)/,
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
