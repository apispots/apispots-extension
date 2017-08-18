const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

let webpackConfig = {

  context: path.resolve(__dirname, 'src/'),

  entry: {
    base: './common/base.js',
    openapis: './modules/openapis/index.js',
    background: './browser/background/index.js',
    content: './browser/content/index.js'
  },

  output: {
    path: path.resolve(__dirname, 'extension/dist'),
    filename: '[name].bundle.js'
  },

  devtool: false,

  plugins: [

    new ExtractTextPlugin('styles.css'),

    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery',
      Handlebars: 'handlebars/runtime'
    }),

    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    //
    // new webpack.optimize.UglifyJsPlugin({
    //   parallel: true,
    //   sourceMap: false,
    //   exclude: /\/content.bundle.js/
    // })

  ]

};


/*
 * CSS bundles
 */

webpackConfig = merge(webpackConfig, {
  module: {
    rules: [{
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        use: 'css-loader'
      })
    },
    {
      test: /\.(png|svg|jpg|gif)$/,
      use: [
        'file-loader'
      ]
    },
    {
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: [
        'file-loader'
      ]
    },
    {
      test: /\.html$/,
      loader: 'html-loader'
    },
    {
      test: /\.hbs$/,
      use: [{
        loader: 'handlebars-loader',
        options: {
          rootRelative: path.join(__dirname, 'extension', 'templates/'),
          knownHelpers: [
            'eq'
          ],
          knownHelpersOnly: false
        }
      }]
    }
    ]
  }
});


module.exports = webpackConfig;
