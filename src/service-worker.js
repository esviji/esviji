import { clientsClaim, skipWaiting, setCacheNameDetails } from 'workbox-core';
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  matchPrecache,
} from 'workbox-precaching';
import {
  registerRoute,
  setDefaultHandler,
  setCatchHandler,
} from 'workbox-routing';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { ExpirationPlugin } from 'workbox-expiration';
import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import * as googleAnalytics from 'workbox-google-analytics';

setCacheNameDetails({
  prefix: '',
  suffix: '',
  precache: 'esviji-precache',
  runtime: 'esviji-runtime',
  googleAnalytics: 'esviji-analytics',
});

precacheAndRoute(self.__WB_MANIFEST, {
  // Ignore all URL parameters:
  // https://developers.google.com/web/tools/workbox/modules/workbox-precaching#ignore_url_parameters
  ignoreURLParametersMatching: [/.*/],
});

cleanupOutdatedCaches();

// default strategy
setDefaultHandler(
  new StaleWhileRevalidate({
    cacheName: 'esviji',
    plugins: [new BroadcastUpdatePlugin()],
  })
);

registerRoute(
  /.*\.mp3/,
  new CacheFirst({
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new RangeRequestsPlugin(),
    ],
  })
);

// Google Analytics library
registerRoute(
  'https://www.google-analytics.com/analytics.js',
  new CacheFirst({
    cacheName: 'third-party',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 10 * 24 * 60 * 60, // 10 Days
      }),
    ],
  })
);

setCatchHandler(({ event }) => {
  switch (event.request.destination) {
    case 'document':
      return matchPrecache('/');

    case 'image':
      return new Response(
        '<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 225" xmlns="https://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><title id="offline-title">Offline</title><path fill="rgba(145,145,145,0.5)" d="M0 0h400v225H0z" /><text fill="rgba(0,0,0,0.33)" font-family="Georgia,serif" font-size="27" text-anchor="middle" x="200" y="113" dominant-baseline="central">offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );

    default:
      // If we don't have a fallback, just return an error response.
      return new Response(
        "Service Temporarily Unavailable, Service Worker couldn't respond.",
        {
          status: 503,
          statusText:
            "Service Temporarily Unavailable, Service Worker couldn't respond.",
          contentType: 'text/plain',
        }
      );
  }
});

googleAnalytics.initialize({
  hitFilter: (params) => {
    const queueTimeInSeconds = Math.round(params.get('qt') / 1000);
    params.set('cm2', queueTimeInSeconds);
  },
  parameterOverrides: {
    cd4: 'offline',
  },
});

skipWaiting();
clientsClaim();
