const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

let webpackConfig = {

  mode: 'development',

  context: path.resolve(__dirname, 'src/'),

  entry: {
    base: './common/base.js',
    home: './modules/home/index.js',
    api: './modules/api/index.js',
    background: './browser/background/index.js',
    content: './browser/content/index.js'
  },

  output: {
    path: path.resolve(__dirname, 'extension/dist'),
    filename: '[name].bundle.js'
  },

  devServer: {
    contentBase: path.join(__dirname, 'src//'),
    port: 8080
  },

  devtool: 'cheap-module-source-map',

  plugins: [

    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: '[name].css',
      chunkFilename: '[id].css'
    }),

    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery',
      Dropzone: 'dropzone',
      Handlebars: 'handlebars/runtime',
      swal: 'sweetalert2',
      postal: 'postal'
    })

  ],

  resolve: {
    fallback: {
      stream: require.resolve("stream-browserify") 
    }
  }

};


/*
 * CSS bundles
 */

webpackConfig = merge(webpackConfig, {
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            // you can specify a publicPath here
            // by default it use publicPath in webpackOptions.output
            publicPath: '../'
          }
        },
        'css-loader'
      ]
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
