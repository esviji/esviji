// Put Google Analytics events in localStorage when offline
// Inspired by:
// - http://stackoverflow.com/questions/8114809/tracking-offline-event-with-google-analytics
// - http://stackoverflow.com/questions/11500438/checking-if-google-analytics-library-has-already-been-included

var offlineAnalytics = {
  push: function(arr) {
    if((navigator.onLine || !('onLine' in navigator)) && !(window._gaq instanceof Array)) {
      // Online or browser doesn't support onLine/offLine detection and GA loaded
      var l = arr.length;
      for (var i = 0; i < l; i++) {
        var elt = arr[i];
        switch (elt.name) {
          case 'version':
            ga('set', 'dimension1', elt.value);
            break;
          case 'level':
            ga('set', 'dimension2', elt.value);
            break;
          case 'score':
            ga('set', 'dimension3', elt.value);
            break;
          case 'view':
            ga('send', 'pageview', elt.value);
            break;
        }
      }
    } else {
      this.store(arr);
    }
  },

  store: function(arr) {
    var stored = store.get('offlineAnalytics') || [];
    stored.push(arr);
    store.set('offlineAnalytics', stored);
    this.sync();
  },

  sync: function() {
    if(navigator.onLine || !('onLine' in navigator)) {
      // Online or browser doesn't support onLine/offLine detection
      _gaq.push(store.get('offlineAnalytics'));
      store.remove('offlineAnalytics');
    }
  }
};

$(window).bind('online', function() {
  offlineAnalytics.sync();
});
