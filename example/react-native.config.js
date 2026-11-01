const path = require('path');
const pkg = require('../package.json');

module.exports = {
  project: {
    ios: {
      // GitHub CI installs Pods explicitly with bounded retries before building.
      // Avoid a second, unguarded install in the build-ios command.
      automaticPodsInstallation: process.env.CI !== 'true',
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, '..'),
      platforms: {
        // Codegen script incorrectly fails without this
        // So we explicitly specify the platforms with empty object
        ios: {},
        android: {},
      },
    },
  },
};
