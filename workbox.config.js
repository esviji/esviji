const path = require('path');

const BUILD_DIR = 'dist';

module.exports = {
  globDirectory: BUILD_DIR,
  globPatterns: [
    '*.html',
    '*.js',
    '*.css',
    '*.woff2',
    '*.png',
    'manifest.webmanifest',
    'sounds/effects*',
  ],
  swSrc: path.join(BUILD_DIR, 'service-worker.js'),
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  mode: 'production',
};
