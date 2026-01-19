const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  devtool: isDevelopment ? 'inline-source-map' : false,
  
  entry: {
    'background/service-worker': './background/service-worker.ts',
    'popup/popup': './popup/popup.tsx',
    'content/content-script': './content/content-script.ts',
    'content/whatsapp-automation': './content/whatsapp-automation.ts'
  },
  
  output: {
    path: path.resolve(__dirname, 'extension-dist'),
    filename: '[name].js',
    clean: true
  },
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json')
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'popup/index.html',
          to: 'popup/index.html'
        },
        {
          from: 'assets',
          to: 'assets'
        }
      ]
    })
  ],
  
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  },
  
  // Chrome extension specific configurations
  target: 'web',
  resolve: {
    fallback: {
      // Exclude Node.js polyfills not needed in extension context
      "fs": false,
      "path": false,
      "crypto": false
    }
  }
};
