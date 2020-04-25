const path = require('path');

const BUILD_DIR = 'build';

module.exports = {
  globDirectory: BUILD_DIR,
  globPatterns: ['/', '**/*.{js,css,woff2,webmanifest}'],
  swSrc: path.join(BUILD_DIR, 'service-worker.js'),
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  mode: 'production',
};
