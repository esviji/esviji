// Put Google Analytics events in localStorage when offline, sync when back online

var offlineAnalytics = {
  isOnline: function () {
    return (navigator.onLine || !('onLine' in navigator)) && (typeof window.ga === "function");
  },

  push: function(arr) {
    if(this.isOnline()) {
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
    if(this.isOnline()) {
      var stored = store.get('offlineAnalytics') || [];
      store.remove('offlineAnalytics');
      this.push(stored);
    } else {
      window.setTimeout(offlineAnalytics.sync, 1000 * 60);
    }
  }
};

$(window).bind('online', function() {
  offlineAnalytics.sync();
});
