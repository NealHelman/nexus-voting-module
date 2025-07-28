const path = require('node:path');
const webpackAliases = require('nexus-module/lib/webpackAliases').default;

console.log('=== WEBPACK CONFIG LOADED ===');
console.log('NODE_ENV:', process.env.NODE_ENV);

module.exports = {
  mode: process.env.NODE_ENV,
  devtool: 'source-map',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/js'),
    filename: 'app.js',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            presets: [
              ['@babel/preset-env', { targets: require('nexus-module/lib/browserslistQuery').default }],
              ['@babel/preset-react', { development: process.env.NODE_ENV !== 'production', runtime: 'automatic' }],
              ['@babel/preset-typescript', { 
                allowNamespaces: true,
                allowDeclareFields: true
              }],
            ],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  resolve: {
    alias: webpackAliases,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
};
