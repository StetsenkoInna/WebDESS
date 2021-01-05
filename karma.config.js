var webpackConfig = require('./webpack.config.js');

module.exports = function (config) {
  config.set({
      frameworks: ['mocha'],
      files: [
          'public/Scripts/index.js',
          'test/mainSpec.js'
      ],
      preprocessors: {
        'test/**/*.js': ['webpack']
      },
      port: 9876,  // karma web server port
      colors: true,
      logLevel: config.LOG_INFO,
      browsers: ['Chrome'],
      webpack: webpackConfig,
      webpackMiddleware: {
        noInfo: true
      }
  })
}
