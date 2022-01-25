const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const EncodingPlugin = require('webpack-encoding-plugin');
const TerserPlugin = require("terser-webpack-plugin");


const webpackConfig = [

  {

    mode: 'production',

    context: path.resolve(__dirname, 'src/'),

    entry: {
      base: './common/base.js',
      openapis: './modules/openapis/index.js',
      background: './browser/background/index.js'
    },

    output: {
      path: path.resolve(__dirname, 'extension/dist'),
      filename: '[name].bundle.js'
    },

    devtool: false,

    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()],
    },

    module: {

      rules: [{
        test: /\.css$/,
        use: [{
          loader: MiniCssExtractPlugin.loader
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
    },

    plugins: [

      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].css',
        chunkFilename: 'styles.css'
      }),
      // new ExtractTextPlugin('styles.css'),

      new webpack.ProvidePlugin({
        jQuery: 'jquery',
        $: 'jquery',
        jquery: 'jquery',
        Handlebars: 'handlebars/runtime'
      }),

      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      })
      
    ]

  },

  {

    mode: 'production',

    context: path.resolve(__dirname, 'src/'),

    entry: {
      content: './browser/content/index.js',
    },

    output: {
      path: path.resolve(__dirname, 'extension/dist'),
      filename: '[name].bundle.js'
    },

    devtool: false,

    plugins: [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),

      new EncodingPlugin({
        encoding: 'ascii'
      })
    ]

  }


];


module.exports = webpackConfig;
