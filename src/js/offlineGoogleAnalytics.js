// Put Google Analytics events in localStorage when offline
// Inspired by:
// - http://stackoverflow.com/questions/8114809/tracking-offline-event-with-google-analytics
// - http://stackoverflow.com/questions/11500438/checking-if-google-analytics-library-has-already-been-included

var _ogaq = {
  push: function(arr) {
    if((navigator.onLine || !('onLine' in navigator)) && !(window._gaq instanceof Array)) {
      // Online or browser doesn't support onLine/offLine detection and GA loaded
      _gaq.push(arr);
    } else {
      this.store(arr);
    }
  },
  store: function(arr) {
    var stored = store.get('offlineGA') || [];
    stored.push(arr);
    store.set('offlineGA', stored);
    this.sync();
  },
  sync: function() {
    if (window._gaq instanceof Array) {
      // GA not loaded
      this.loadGA();
    } else {
      // GA loaded
      if(navigator.onLine || !('onLine' in navigator)) {
        // Online or browser doesn't support onLine/offLine detection
        _gaq.push(store.get('offlineGA'));
        store.remove('offlineGA');
      }
    }
  },
  loadGA: function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  }
};

$(window).bind('online', function() {
  _ogaq.sync();
});
