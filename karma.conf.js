// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require("path");
module.exports = function (config) {
  config.set({
    customLaunchers: {
      ChromeCustom: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
        ]
      }
    },
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-junit-reporter'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-summary-reporter'),
      require('karma-chrome-launcher'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    junitReporter: {
      outputDir: path.join(__dirname, 'var'),
      outputFile: 'logfile.xml',
      useBrowserName: false,
    },
    coverageReporter: {
      dir: path.join(__dirname, 'var/coverage'),
      reporters: [
        {type: "html"},
        {type: "text-summary"},
      ],
      check: {
        global: {
          statements: 50,
          branches: 35,
          functions: 40,
          lines: 50
        }
      }
    },
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    singleRun: true,
    reporters: ['progress', 'kjhtml', 'junit', 'summary'],
    summaryReporter: {
      // 'failed', 'skipped' or 'all'
      show: 'failed',
      // Limit the spec label to this length
      specLength: 50,
      // Show an 'all' column as a summary
      overviewColumn: true,
      // Show a list of test clients, 'always', 'never' or 'ifneeded'
      browserList: 'always',
      // Use custom symbols to indicate success and failure
      symbols: {success: '+', failure: 'x'}
    },
    port: 9875,
    browserNoActivityTimeout: 60000,
    reportSlowerThan: 100,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeCustom']
  });
};
