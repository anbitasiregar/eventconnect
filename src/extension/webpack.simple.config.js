const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  
  entry: {
    'background/service-worker': path.resolve(__dirname, 'background/service-worker.ts'),
    'popup/popup': path.resolve(__dirname, 'popup/popup.tsx'),
    'content/content-script': path.resolve(__dirname, 'content/content-script.ts')
  },
  
  output: {
    path: path.resolve(__dirname, 'extension-dist'),
    filename: '[name].js',
    clean: true
  },
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      "process": false,
      "buffer": false,
      "path": false,
      "os": false,
      "crypto": false,
      "fs": false,
      "stream": false,
      "util": false,
      "url": false,
      "querystring": false,
      "http": false,
      "https": false,
      "net": false,
      "tls": false,
      "zlib": false
    }
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup/index.html', to: 'popup/index.html' },
        { from: 'assets', to: 'assets' }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID || '554258518238-9fs00eer4665qggru39lfmi4o6jrq42n.apps.googleusercontent.com'),
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'https://api.eventconnect.app')
    })
  ],
  
  target: 'web'
};
