'use strict';
const path = require('path');

const PROD = JSON.parse(process.env.PROD_ENV || '0');

module.exports = {
  entry: {
    clmtrackr: './js/index.js'
  },
  output: {
    filename: PROD ? '[name].min.js' : '[name].js',
    path: path.resolve(__dirname),
    libraryTarget: 'umd',
    library: 'clm'
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  }
};
