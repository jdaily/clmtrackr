'use strict';
const path = require('path');
const nib = require('nib');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
  entry: {
    clmtrackr: path.resolve(__dirname, 'js'),
    examples: path.resolve(__dirname, 'examples')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: NODE_ENV === 'production' ? '/clmtrackr/' : '/',
    libraryTarget: 'umd',
    library: 'clm'
  },
  resolve: {
    alias: {
      'clmtrackr': path.resolve(__dirname),
      'stats.js': path.resolve(__dirname, 'lib', 'stats.js')
    },
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.vert', '.frag', '.glsl']
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
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader?presets[]=es2015&presets[]=react!ts-loader?ignoreDiagnostics[]=2307'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        // include: path.join(__dirname, 'src'),
        exclude: /(node_modules)/,
        query: {
          presets: ['es2015', 'react']
        }
      },
      {
        test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3|ogv|mp4|webm)$/,
        loader: 'file'
      },
      {
        test: /\.(glsl|vert|frag)$/,
        loader: 'glsl-template-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Clmtrackr Examples',
      template: path.resolve(__dirname, 'examples', 'index.html'),
      chunks: ['examples']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
    })
  ],
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
