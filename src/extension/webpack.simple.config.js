const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
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
    })
  ],
  
  target: 'web'
};
