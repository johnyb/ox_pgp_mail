var allTestFiles = [];
var TEST_REGEXP = /_spec\.js$/i;

var pathToModule = function(path) {
  return path;
//   return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    allTestFiles.push(pathToModule(file));
  }
});

require(['io.ox/core/extPatterns/stage'], function (Stage) {

    'use strict';

    ox.testUtils.stubAppsuiteBody();

    new Stage('io.ox/core/stages', {
        id: 'run_tests',
        index: 99999,
        run: function (baton) {
            requirejs.config({
                // Karma serves files from '/base/apps'
                baseUrl: '/base/apps',

                // ask Require.js to load these files (all our tests)
                deps: allTestFiles,

                // start test run, once Require.js is done
                callback: window.__karma__.start
            });
        }
    });
});
