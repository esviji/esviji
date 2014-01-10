// SVGEventListener.js
// Version - 0.2.3
//
// by MAD - @madsgraphics - ecrire[at]madsgraphics[dot]com
//
// https://github.com/madsgraphics/SVGEventListener/
//
// Tri-license - WTFPL | MIT | BSD
//
// Please minify before use.

( function ( undefined ) {

  'use strict';

  var legacy,
      svgns,
      isArray,
      supportedEvents;

  legacy = {
    addEventListener : Element.prototype.addEventListener,
    svgAnimateBeginElement : SVGAnimateElement.prototype.beginElement,
    svgAnimateTransformBeginElement : SVGAnimateTransformElement.prototype.beginElement
  };

  svgns = 'http://www.w3.org/2000/svg';

  // helper functions
  function isString( s ) {
    return typeof s === 'string';
  };
  isArray = Array.isArray || function ( obj ) {
    return {}.toString.call( obj ) === '[object Array]';
  };
  function isUndefined( obj ) {
    return obj === undefined;
  };
  // String prototyping to add `contains`
  String.prototype.contains = function(pattern) {
    return (this.indexOf(pattern) !== -1);
  };

  // Cache events support
  supportedEvents = {};
  function isEventSupported( eventName ) {
    // early return if the event is in cache
    if ( supportedEvents[eventName] !== undefined ) {
      return supportedEvents[eventName];
    }

    // initiliaze the support at false for detection
    supportedEvents[eventName] = false;
    // create svg (and childs) nodes
    var svg     = document.createElementNS( svgns, 'svg' ),
        element = document.createElementNS( svgns, 'rect'),
        animate = document.createElementNS( svgns, 'animate' );

    // set duration to 1ms to detect endEvent
    animate.setAttributeNS(null, 'dur', '1ms');
    animate.setAttributeNS(null, 'attributeName', 'x');
    // append elements
    element.appendChild(animate);
    svg.appendChild(element);

    // attach a listener to the event that update the events cache
    legacy.addEventListener.call(animate, eventName + 'Event', function() {
      supportedEvents[eventName] = true;
    }, false);

    // attach svg to the DOM (else it doesn't detect anything) but cache it
    svg.setAttributeNS(null, 'style', 'display:none');
    document.body.appendChild(svg);
    // Set a timeout to remove the dummy SVG element
    // It is setted to 50 to leave the DOM breath and get the SVG event
    // result before removing it :)
    setTimeout(function() { document.body.removeChild(svg); }, 50);

    // Return the current event support status
    return supportedEvents[eventName];
  };

  //////////////////////////////////////////////////////////////////////////////
  // Clocker.js
  // Convert a legal clock string value (in SMIL definition) to milliseconds
  //
  // Originaly released here: https://github.com/madsgraphics/clocker.js
  function clocker( timestr ) {
    var time,
        times = timestr.split( ':' );

    // Timecount-value
    // = Formats without ':'
    if ( times.length === 1 ) {
      time = times[0];
      // Time already given in milliseconds (250ms)
      if ( time.lastIndexOf('ms') !== -1 ) {
        return +(time);
      }
      // Othermetrics
      else {
        // minutes
        if( time.lastIndexOf('min') !== -1 ) {
          time = parseFloat(time) * 60;
        }
        // hours
        else if( time.lastIndexOf('h') !== -1 ) {
          time = parseFloat(time) * 3600;
        }
        // Time is now in seconds.
        // If time is without metric, then assume in seconds,
        // maybe float (2.05 == 2050ms)
        // So convert in ms…
        return parseFloat(time) * 1000;
      }
    }
    // Full-clock-value || Partial-clock-value
    else {
      // Reverse order to iterate from seconds to hours
      times.reverse();
      // Init time
      time = 0;
      for ( var t in times ) {
        // Value * 60^t (hours / minutes to seconds) * 1000 (s to ms)
        time += times[t]*Math.pow(60, t)*1000;
      }

      return time;
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Event Listener
  //
  // Custom Event listener
  // Implements Observer pattern

  // Create custom listener object with private property to store listeners
  //
  // initially inspired by:
  // http://www.nczonline.net/blog/2010/03/09/custom-events-in-javascript/
  function EventListener( element ) {
    // store SVG node
    this.el = element;
    // Initialize events stack
    this._listeners = {};
    // constructs stack
    this._init();
  }

  // Extends it to add and fire events
  EventListener.prototype = {
    constructor: EventListener,
    _delayEvent: function (eventName, duration) {
      var that = this,
          dur = clocker( duration );
      return function () {
        window.setTimeout( function () {
          that.fire( eventName + 'Event' );
        }, dur);
      };
    },

    _attachEvent: function (eventName, id) {
      var that = this,
          previousAnimate = document.getElementById( id );
      // Early exit if there is no previousAnimate element available
      if (previousAnimate == null) { return; }
      // Add an endEvent that launch the next animation
      previousAnimate.addEventListener( eventName + 'Event', function () {
        that.fire( 'beginEvent' );
      });
    },
    // initializer
    _init: function () {
      var that  = this,
          begin = this.el.getAttribute('begin'),
          dur   = this.el.getAttribute('dur'),
          index;

      // End event
      // ---------
      // Add a delayed at duration time
      this.add('beginEvent', this._delayEvent('end', dur));

      // Begin event
      // -----------
      // Begin event delayed
      if ( begin !== 'indefinite' && !begin.contains('.end') && !begin.contains('.begin') ) {
        this._delayEvent('begin', begin);
      }
      // if the launch depends of the **end** of another animation
      else if ( begin.contains('.end') ) {
        this._attachEvent('end', begin.replace('.end', ''));
      }
      // if the launch depends of the **begin** of another animation
      else if ( begin.contains('.begin') ) {
        this._attachEvent('begin', begin.replace('.begin', ''));
      }
    },
    // add new event to listeners
    add: function addListener( type, listener ) {
      // if there is no triggers already defined for this events,
      // init an a-empty array
      if ( isUndefined( this._listeners[type] ) ) {
        this._listeners[type] = [];
      }
      // add trigger to the event
      this._listeners[type].push( listener );
    },
    // fire the event
    fire: function fireListeners( event ) {
      var name;

      // if called only by event name (useful), build a correct object
      if ( isString( event ) ) {
        event = {
          type: event,
          bubbles: false,
          cancelable: false,
          defaultPrevented: false,
          currentTarget : null,
        };
      }

      // Early return at fire if the event is already supported
      name = event.type.substr(0, event.type.indexOf('Event'));
      if (isEventSupported( name )) { return; }

      // set target if unavailable
      if ( !event.target ) {
        event.target = event.currentTarget = this.el;
      }
      // if there is no event given, throw an error
      if ( !event.type ) {
        throw new Error( 'Event object missing "type" property.' );
      }
      // If the type has associated triggers, then launch them
      if ( isArray( this._listeners[event.type] ) ) {
        var listeners = this._listeners[event.type];
        for ( var l in listeners ) {
          listeners[l].call( this.el, event );
        }
      }
    }
  };

  // Overwrite Element.addEventListener method for transparency fallback
  //
  // Inpired by:
  // http://stackoverflow.com/questions/7220515/extending-node-addeventlistener-method-with-the-same-name#7220628
  Element.prototype.addEventListener = function ( type, listener, useCapture ) {
    if ( this instanceof SVGAnimateElement
      || this instanceof SVGAnimateTransformElement ) {
      // ***
      // Attach a new event listeners stack if it doesn't exists
      if ( isUndefined( this.listeners ) )
      {
        this.listeners = new EventListener( this );
      }
      // ***
      // check event name and support for endEvent
      if ( type === 'endEvent' && !isEventSupported( 'end' ) ) {
        // Add listener to the endEvent stack
        this.listeners.add( type, listener );
      }
      // ***
      // check event name and suport for beginEvent
      if ( type === 'beginEvent' && !isEventSupported( 'begin' ) ) {
        // Add listener to the endEvent stack
        this.listeners.add( type, listener );
      }
    }
    // ***
    // call the original method for fallback
    return legacy.addEventListener.call( this, type, listener, useCapture );
  };

  // Overwrite Element.beginElement method to trigger begin event
  SVGAnimateElement.prototype.beginElement = function() {
    if ( !isEventSupported( 'begin' ) && this.listeners !== undefined) {
      this.listeners.fire('beginEvent');
    }
    return legacy.svgAnimateBeginElement.call(this);
  };

  SVGAnimateTransformElement.prototype.beginElement = function() {
    if ( !isEventSupported( 'begin' ) && this.listeners !== undefined) {
      this.listeners.fire('beginEvent');
    }
    return legacy.svgAnimateTransformBeginElement.call(this);
  };

})();
