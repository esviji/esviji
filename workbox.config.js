const path = require('path');

const BUILD_DIR = 'dist';

module.exports = {
  globDirectory: BUILD_DIR,
  globPatterns: [
    'index.html',
    'esviji.*.js',
    'modernizr-custom.*.js',
    'viewport-units-buggyfill-*.js',
    'styles.*.css',
    'sansitaone-webfont.*.woff2',
    'esviji-logo-180.*.png',
    'manifest.webmanifest',
    'sounds/effects*',
  ],
  swSrc: path.join(BUILD_DIR, 'service-worker.js'),
  swDest: path.join(BUILD_DIR, 'service-worker.js'),
  mode: 'production',
};
