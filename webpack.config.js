var path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    net: './public/Scripts/app/net',
    model: './public/Scripts/app/model',
  },
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'public/dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
