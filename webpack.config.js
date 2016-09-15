'use strict';
const path = require('path');
const nib = require('nib');

const config = {
  entry: {
    clmtrackr: path.resolve(__dirname, 'js'),
    examples: path.resolve(__dirname, 'examples')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    libraryTarget: 'umd',
    library: 'clm'
  },
  resolve: {
    alias: {
      'clmtrackr': path.resolve(__dirname),
      'stats.js': path.resolve(__dirname, 'lib', 'stats.js')
    }
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
          presets: ['es2015', 'react']
        }
      }
    ]
  },
  stylus: {
    use: [nib()],
    import: ['~nib/lib/nib/index.styl'],
    preferPathResolver: 'webpack'
  }
};

// Use normal style-loader in dev (hot reload css)
config.module.loaders.push({
  test: /\.styl$/,
  loader: 'style-loader!css-loader!stylus-loader'
});


module.exports = config;
